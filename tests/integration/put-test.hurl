
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`fragment`

HTTP/1.1 201
[Captures]
url: header "Location"


PUT {{url}}
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Updated fragment`

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.id" matches "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
jsonpath "$.updated" isString
jsonpath "$.size" == 16 


PUT {{url}}
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
`update`

HTTP/1.1 400
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 400



PUT {{url}}
Content-Type: text/plain

HTTP/1.1 401
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"
