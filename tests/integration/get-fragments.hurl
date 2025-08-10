
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1


HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" exists
jsonpath "$.fragments[*]" exists 


GET http://localhost:8080/v1/fragments


HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
