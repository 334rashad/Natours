# Natours API

A guide to the HTTP API exposed by this application.

## Base URL

When running locally, the default base URL is:

```text
http://localhost:3000/api/v1
```

The port can be changed with the `PORT` environment variable.

## Tours

### List tours

```http
GET /tours
```

Returns one page of tours. The response has this shape:

```json
{
  "status": "success",
  "results": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 9,
    "totalPages": 1
  },
  "data": {
    "tours": [
      {
        "_id": "MongoDB document ID",
        "name": "The Forest Hiker",
        "duration": 5,
        "price": 397
      }
    ]
  }
}
```

### Paginate tours

Use the `page` and `limit` parameters to request one page at a time:

```http
GET /tours?page=2&limit=5
```

`page` defaults to `1` and `limit` defaults to `10`. `limit` can be at most `100`. `results` is the number of tours on the current page, and `pagination.total` is the number of tours matching the filters. Pagination combines with filters, sorting, and field limiting. A page past the last one returns an empty `tours` array. A `page` or `limit` value that is not a positive integer, or a `limit` above `100`, returns `400 Bad Request`.

### Filter tours

Use a tour field as a query parameter for an exact match:

```http
GET /tours?duration=5
```

Range filters support `gt`, `gte`, `lt`, and `lte`:

```http
GET /tours?duration[gte]=5&duration[lte]=7
```

You can combine exact matches and range conditions:

```http
GET /tours?difficulty=easy&price[lt]=500
```

The query parser turns bracket notation into nested query values. Only fields defined in the Tour schema are used; unknown fields are ignored. For a known field, unsupported nested operators return `400 Bad Request`. Values arrive from the URL as strings and Mongoose casts them to the schema field's type.

### Sort tours

Use the `sort` parameter with a comma-separated list of tour fields. Fields are applied in the order given. Ascending is the default; prefix a field with `-` for descending:

```http
GET /tours?sort=price
GET /tours?sort=-price
GET /tours?sort=price,-ratingsAverage
```

Sorting combines with filters:

```http
GET /tours?difficulty=easy&sort=-ratingsAverage,price
```

When `sort` is omitted or empty, tours are returned newest first (`-createdAt`). Tours with equal sort values are ordered by `_id` so that pages stay consistent, unless `_id` is part of `sort`. A field that is not in the Tour schema, or a `sort` value that is not a string (for example, repeating the parameter), returns `400 Bad Request`.

### Limit fields

Use the `fields` parameter with a comma-separated list of tour fields to return only those fields. Prefix every field with `-` to return all fields except the listed ones:

```http
GET /tours?fields=name,price
GET /tours?fields=-description,-images
```

Field limiting works on both `GET /tours` and `GET /tours/:id`, and combines with filters and sorting:

```http
GET /tours?difficulty=easy&sort=price&fields=name,price,difficulty
```

Included and excluded fields cannot be mixed in one request. A field that is not in the Tour schema, a mix of included and excluded fields, or a `fields` value that is not a string returns `400 Bad Request`. When `fields` is omitted or empty, every field is returned.

### Get one tour

```http
GET /tours/:id
```

Replace `:id` with the tour's MongoDB document ID.

### Create a tour

```http
POST /tours
Content-Type: application/json
```

The required fields are `name`, `duration`, `maxGroupSize`, `difficulty`, `price`, `summary`, and `imageCover`.

```json
{
  "name": "The Forest Hiker",
  "duration": 5,
  "maxGroupSize": 25,
  "difficulty": "easy",
  "price": 397,
  "summary": "A scenic hike through the forest",
  "imageCover": "forest-hiker.jpg"
}
```

On success, the API responds with `201 Created` and the created tour in `data.tour`.

### Update a tour

```http
PATCH /tours/:id
Content-Type: application/json
```

Send a JSON object containing the fields to update. Empty bodies and attempts to change `_id` are rejected. The API responds with the updated tour in `data.tour`.

### Delete a tour

```http
DELETE /tours/:id
```

On success, the API responds with `204 No Content`.

## Users

User routes are reserved but not implemented yet. Requests to `/users` and `/users/:id` return `501 Not Implemented`.

## Errors

Errors use a JSON response with a `message`:

```json
{
  "status": "fail",
  "message": "Tour not found"
}
```

Common statuses include `400 Bad Request` for invalid input, `404 Not Found` when a tour does not exist, and `501 Not Implemented` for the unfinished user routes.
