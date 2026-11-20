//go:build windows

package main

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
	"unsafe"
)

func browserCandidates() []string {
	var list []string
	for _, env := range []string{"ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"} {
		if b := os.Getenv(env); b != "" {
			list = append(list, filepath.Join(b, "Microsoft", "Edge", "Application", "msedge.exe"))
		}
	}
	for _, env := range []string{"ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"} {
		if b := os.Getenv(env); b != "" {
			list = append(list, filepath.Join(b, "Google", "Chrome", "Application", "chrome.exe"))
		}
	}
	return list
}

// 앱 창을 열고, 창이 닫힐 때까지 기다렸으면 true
func openWindow(url, dir string) bool {
	for _, exe := range browserCandidates() {
		if _, err := os.Stat(exe); err != nil {
			continue
		}
		cmd := exec.Command(exe,
			"--app="+url,
			"--window-size=430,900",
			"--user-data-dir="+filepath.Join(dir, "browser"),
			"--no-first-run",
			"--no-default-browser-check",
			"--disable-sync",
			"--lang=ko",
		)
		start := time.Now()
		if err := cmd.Start(); err != nil {
			log.Println("browser start failed", exe, err)
			continue
		}
		log.Println("browser started", exe)
		err := cmd.Wait()
		log.Println("browser exited after", time.Since(start), err)
		// 바로 끝났다면 이미 떠 있는 창에 넘겨준 것 → 생존 신호 방식으로 대기
		return time.Since(start) > 4*time.Second
	}
	// Edge/Chrome 이 없으면 기본 브라우저로 열기
	log.Println("no Edge/Chrome found")
	openDefaultBrowser(url)
	return false
}

func openDefaultBrowser(url string) {
	if err := exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start(); err != nil {
		log.Println("default browser failed", err)
		exec.Command("cmd", "/c", "start", "", url).Start()
	}
}

func showError(msg string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	box := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(appTitle)
	m, _ := syscall.UTF16PtrFromString(msg)
	box.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(t)), 0x10)
}
