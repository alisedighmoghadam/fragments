


POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Fragment`


HTTP/1.1 201
[Captures]
url: header "Location"


GET {{url}}
[BasicAuth]
user1@email.com:password1


HTTP/1.1 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.body" == "Fragment"


GET {{url}}


HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"



GET http://localhost:8080/v1/fragments/non-existent-id
[BasicAuth]
user1@email.com:password1


HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
