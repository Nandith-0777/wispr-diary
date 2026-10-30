$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$diaryRoot = Split-Path $PSScriptRoot -Parent
$diaryScenes = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scenes.json') -Raw | ConvertFrom-Json
$diaryVoiceDirectory = Join-Path $diaryRoot 'artifacts/wispr-diary-promo/voice'
[System.IO.Directory]::CreateDirectory($diaryVoiceDirectory) | Out-Null
$diaryNarrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$diaryNarrator.SelectVoice('Microsoft Zira Desktop')
$diaryNarrator.Rate = 0
$diaryNarrator.Volume = 100
try {
    for ($diaryIndex=0; $diaryIndex -lt $diaryScenes.Count; $diaryIndex++) {
        $diaryWavePath = Join-Path $diaryVoiceDirectory ('{0:D2}-{1}.wav' -f $diaryIndex, $diaryScenes[$diaryIndex].id)
        $diaryNarrator.SetOutputToWaveFile($diaryWavePath)
        $diaryNarrator.Speak($diaryScenes[$diaryIndex].voice)
        $diaryNarrator.SetOutputToNull()
        Write-Output ('Narrated: ' + $diaryScenes[$diaryIndex].id)
    }
} finally {
    $diaryNarrator.Dispose()
}
