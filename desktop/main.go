// 생활 계산기 — 윈도우 실행 파일
//
// 동작 방식
//  1. www 폴더(앱 화면)를 실행 파일 안에 내장하고 127.0.0.1 전용 로컬 서버로 제공합니다.
//  2. Microsoft Edge 를 "앱 모드"(주소창 없는 창)로 열어 휴대폰 크기로 표시합니다.
//  3. 환율·지수 시세 요청은 /proxy 로 중계해 브라우저 보안정책(CORS) 문제를 피합니다.
//  4. 앱 창을 닫으면 로컬 서버도 함께 종료됩니다.
//
// 빌드:  GOOS=windows GOARCH=amd64 go build -ldflags "-H windowsgui -s -w" -o 생활계산기.exe
package main

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"time"
)

//go:embed all:www
var embedded embed.FS

const (
	basePort  = 47815 // 고정 포트 → 저장 데이터(localStorage)가 계속 유지됨
	appTitle  = "생활 계산기"
	userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0"
)

// 시세 중계를 허용하는 주소 (그 외는 거부)
var allowedHosts = []string{
	"m.stock.naver.com",
	"cdn.jsdelivr.net",
	".currency-api.pages.dev",
	"api.frankfurter.dev",
}

var lastPing atomic.Int64

func hostAllowed(h string) bool {
	for _, a := range allowedHosts {
		if h == a || (strings.HasPrefix(a, ".") && strings.HasSuffix(h, a)) {
			return true
		}
	}
	return false
}

func proxyHandler(client *http.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw := r.URL.Query().Get("url")
		u, err := url.Parse(raw)
		if err != nil || u.Scheme != "https" || !hostAllowed(u.Hostname()) {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}
		req, _ := http.NewRequestWithContext(r.Context(), http.MethodGet, u.String(), nil)
		req.Header.Set("User-Agent", userAgent)
		req.Header.Set("Accept", "application/json, text/plain, */*")
		if strings.HasSuffix(u.Hostname(), "naver.com") {
			req.Header.Set("Referer", "https://m.stock.naver.com/")
		}
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "upstream error", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		if ct := resp.Header.Get("Content-Type"); ct != "" {
			w.Header().Set("Content-Type", ct)
		}
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, io.LimitReader(resp.Body, 8<<20))
	}
}

func newServer() http.Handler {
	sub, _ := fs.Sub(embedded, "www")
	files := http.FileServer(http.FS(sub))
	client := &http.Client{Timeout: 15 * time.Second}
	mux := http.NewServeMux()

	// 데스크톱 환경 정보: 시세 요청 중계 주소 + 생존 신호
	mux.HandleFunc("/js/env.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		fmt.Fprint(w, `window.LC_ENV = { desktop: true, proxy: '/proxy?url=' };
setInterval(function () { fetch('/__ping', { cache: 'no-store' }).catch(function () {}); }, 20000);
fetch('/__ping', { cache: 'no-store' }).catch(function () {});
`)
	})
	mux.HandleFunc("/__ping", func(w http.ResponseWriter, r *http.Request) {
		lastPing.Store(time.Now().Unix())
		w.Header().Set("X-App", "life-calculator")
		fmt.Fprint(w, "ok")
	})
	mux.HandleFunc("/proxy", proxyHandler(client))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		files.ServeHTTP(w, r)
	}))
	return mux
}

// 이미 실행 중인 생활 계산기가 있는지 확인
func alreadyRunning(port int) bool {
	c := &http.Client{Timeout: 700 * time.Millisecond}
	resp, err := c.Get(fmt.Sprintf("http://127.0.0.1:%d/__ping", port))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.Header.Get("X-App") == "life-calculator"
}

func dataDir() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base, _ = os.UserConfigDir()
	}
	if base == "" {
		base = os.TempDir()
	}
	d := filepath.Join(base, "LifeCalculator")
	os.MkdirAll(d, 0o755)
	return d
}

func main() {
	// 이미 실행 중이면 창만 다시 연다
	for p := basePort; p < basePort+5; p++ {
		if alreadyRunning(p) {
			openWindow(fmt.Sprintf("http://127.0.0.1:%d/", p), dataDir())
			return
		}
	}

	var ln net.Listener
	var err error
	for p := basePort; p < basePort+5; p++ {
		if ln, err = net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", p)); err == nil {
			break
		}
	}
	if ln == nil {
		showError("로컬 서버를 시작할 수 없습니다: " + err.Error())
		return
	}
	addr := ln.Addr().(*net.TCPAddr)
	appURL := fmt.Sprintf("http://127.0.0.1:%d/", addr.Port)
	go http.Serve(ln, newServer())

	lastPing.Store(time.Now().Unix())
	// 화면에서 생존 신호(20초 간격)가 3분 넘게 끊기면 종료 (창을 닫은 경우 등)
	go func() {
		for {
			time.Sleep(15 * time.Second)
			if time.Now().Unix()-lastPing.Load() > 180 {
				os.Exit(0)
			}
		}
	}()
	if openWindow(appURL, dataDir()) {
		return // 앱 창(Edge 앱 모드)이 닫힘 → 종료
	}
	select {} // 생존 신호 감시에 맡김
}
