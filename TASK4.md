# TASK4

TODO: system design answers (200-300 words).

Answer these three questions
1. What are the two most likely causes? What would you check first to confirm your diagnosis?
### Answer --> (a) first it could be bad indexing like having indexing on all the column or not using indexes on the column you are querying, not having a proper combined indexing which can lead the whole table scan. (b) Not having a cashing machenism would end up fetching the same data and end up queing the query load. TO FIND OUT : we can do Explain and Analyze to check weather the query is scanning whole table or running on indexes. and we can also enable slow query logs. and also can check weather the seach data is chased or not.

2. What is your 48-hour fix? One or two concrete changes that reduce the load immediately without a full rewrite.
### Answer --> (a) Add appropriate database indexes: Identify the columns used in artist searches and filters, then add indexes based on the actual query patterns. Use EXPLAIN to validate the query plan before and after. (b) I would do caching and cursor pagination: Cache frequently requested search results in Redis with a short TTL, where appropriate, and enforce cursor pagination to avoid fetching large result sets. (c) Connection Pooling & Rate Limiting: Reuse database connections efficiently and limit excessive API requests to protect the backend from overload.



3. What is the long-term fix? The right architectural solution, and the trade-off you arem accepting by choosing it.
### Answer --> (a) The long-term fix: a separate search engine mysql should keep doing what it does well: storing bookings, payments and artist details. But it isn’t built for searching, so I would add a search tool like Elasticsearch or OpenSearch. It keeps a copy of the artist data in a form that makes searching quick. To keep the two matched up, every time an artist is added or changed in mysql, a message goes into a queue (Kafka or RabbitMQ). A small worker reads that message and updates the search tool. The search endpoint then asks the search tool for results instead of asking mysql, so mysql doesn’t get slammed during busy hours. (b) The trade-off The downside is a short delay. If an artist updates their profile, it might take a few seconds before the change shows up in search. You also end up running one more system, which means more to deploy, watch and back up. If the worker breaks, the search results can go stale, so you need a way to rebuild the search data from mysql.