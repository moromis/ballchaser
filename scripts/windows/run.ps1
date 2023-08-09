echo "Starting server and client"
invoke-expression 'cmd /c start powershell -Command { cd ../../server; yarn start }'
invoke-expression 'cmd /c start powershell -Command { cd ../../client; yarn start }'