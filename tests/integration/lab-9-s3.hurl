# Lab 9 - S3 Integration Test
# This test verifies integration of fragment APIs with S3

# 1. POST a new text fragment to the server
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1
`Hello S3!`


HTTP/1.1 201
[Asserts]
jsonpath "$.status" == "ok"
header "location" exists

# Capture the Location header into a variable called `url`
[Captures]
url: header "Location"

# 2. GET the fragment using the captured url
GET {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "content-type" == "application/json; charset=utf-8"
jsonpath "$.body" == "Hello S3!"

# 3. DELETE the fragment using the same url
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200



GET {{url}}
[BasicAuth]
user1@email.com:password1
[Options]
delay: 5s
HTTP/1.1 404
