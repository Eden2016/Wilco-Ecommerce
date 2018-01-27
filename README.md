# README #

This is Wilco Middleware, CRUD interface and backend processes.

### What is this repository for? ###

Store code for Wilco Middleware for Ecommerce here.

# SETUP #
1. Download repository, it is a nodejs app
2. You will need to setup an instance of: 
-- [MySQL](https://dev.mysql.com/downloads/) running on port 3306
-- [Redis](https://redis.io/topics/quickstart) running on port 6380
3. You will also need a .env file (suggested local values):

```javascript
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_DATABASE=wilcomiddleware
NODE_ENV=development
```
4. You will need a copy of the database, contact [alex@hathaway.xyz](mailto:alex@hathaway.xyz) for one
