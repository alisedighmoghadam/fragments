
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Delete`


HTTP/1.1 201
[Asserts]
header "Location" matches "^http:\/\/localhost:8080\/v1\/fragments\/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.type" == "text/plain"
jsonpath "$.size" == 6
[Captures]
url: header "Location"


DELETE {{url}}
[BasicAuth]
user1@email.com:password1


HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"


GET {{url}}
[BasicAuth]
user1@email.com:password1

[Options]
delay: 5s
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"



DELETE {{url}}


HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"


DELETE http://localhost:8080/v1/fragments/non-existent-id
[BasicAuth]
user1@email.com:password1


HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"

