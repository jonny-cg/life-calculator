#!/bin/sh
# 윈도우 실행 파일 빌드 (Go 1.21+ 필요, 어느 OS에서든 가능)
set -e
cd "$(dirname "$0")"
rm -rf www && cp -r ../www ./www
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../dist/LifeCalculator.exe .
rm -rf www
echo "built: dist/LifeCalculator.exe"
