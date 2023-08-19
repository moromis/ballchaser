echo "Starting server"
invoke-expression 'cmd /c start powershell -noexit -Command { cd ../../server; yarn start }'