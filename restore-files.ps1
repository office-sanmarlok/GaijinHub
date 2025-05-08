# masterブランチのファイルを一時フォルダに解凍する
$zipPath = "..\master-branch-files.zip"
$extractPath = "..\master-temp"
$currentDir = Get-Location

# 前回の一時フォルダが残っていれば削除
if (Test-Path $extractPath) {
    Remove-Item -Path $extractPath -Recurse -Force
}

# 一時フォルダを作成
New-Item -Path $extractPath -ItemType Directory

# ZIPファイルを解凍
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractPath)

# 必要なファイルをコピー
# appディレクトリのコンテンツ
Copy-Item -Path "$extractPath\app\*" -Destination "app\" -Recurse -Force

# componentsディレクトリ（既に部分的に存在する可能性がある）
if (!(Test-Path "components")) {
    New-Item -Path "components" -ItemType Directory
}
Copy-Item -Path "$extractPath\components\*" -Destination "components\" -Recurse -Force

# libディレクトリ
if (!(Test-Path "lib")) {
    New-Item -Path "lib" -ItemType Directory
}
Copy-Item -Path "$extractPath\lib\*" -Destination "lib\" -Recurse -Force

# typesディレクトリ
if (!(Test-Path "types")) {
    New-Item -Path "types" -ItemType Directory
}
Copy-Item -Path "$extractPath\types\*" -Destination "types\" -Recurse -Force

# scriptsディレクトリ
if (!(Test-Path "scripts")) {
    New-Item -Path "scripts" -ItemType Directory
}
Copy-Item -Path "$extractPath\scripts\*" -Destination "scripts\" -Recurse -Force

# publicディレクトリ
if (!(Test-Path "public")) {
    New-Item -Path "public" -ItemType Directory
}
Copy-Item -Path "$extractPath\public\*" -Destination "public\" -Recurse -Force

# ルートディレクトリのファイル
Copy-Item -Path "$extractPath\*.json" -Destination "." -Force
Copy-Item -Path "$extractPath\*.js" -Destination "." -Force
Copy-Item -Path "$extractPath\*.ts" -Destination "." -Force
Copy-Item -Path "$extractPath\*.mjs" -Destination "." -Force
Copy-Item -Path "$extractPath\*.md" -Destination "." -Force

Write-Host "ファイルの復元が完了しました。" 