echo "Installing client and server packages"
invoke-expression 'cmd /c start powershell -Command { cd ../../client; yarn }'
invoke-expression 'cmd /c start powershell -Command { cd ../../server; yarn }'