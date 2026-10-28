Output assets/demo.gif
Set Shell "pwsh"
Set FontSize 13
Set Width 880
Set Height 460
Set Padding 18
Set MarginFill "#0D1220"
Set BorderRadius 16
Set TypingSpeed 60ms

Type "node bin/tailor.mjs audit ../dsh-plugin-resolver --style=evidence"
Enter
Sleep 4s

Type "node bin/tailor.mjs verify ../dsh-plugin-resolver --style=evidence"
Enter
Sleep 4s
