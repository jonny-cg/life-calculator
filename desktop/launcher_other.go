//go:build !windows

package main

import "fmt"

// 개발용(리눅스/맥): 주소만 출력
func openWindow(url, dir string) bool {
	fmt.Println("open:", url)
	return false
}

func showError(msg string) { fmt.Println("error:", msg) }

func openDefaultBrowser(url string) { fmt.Println("default:", url) }
