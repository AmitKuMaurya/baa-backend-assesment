# TASK3

## TODO: leaderboard SQL + index reasoning 


SELECT
  a.name,
  a.category,
  ROUND(r.avg_score, 2)                AS avg_score,
  r.review_count                       AS total_reviews,
  COALESCE(b.completed_count, 0)       AS total_completed_bookings
FROM artists a
JOIN (
  SELECT artist_id,
         AVG(score) AS avg_score,
         COUNT(*)   AS review_count
  FROM reviews
  WHERE created_at >= NOW() - INTERVAL 90 DAY
  GROUP BY artist_id
  HAVING COUNT(*) >= 5
) r ON r.artist_id = a.id
LEFT JOIN (
  SELECT artist_id, COUNT(*) AS completed_count
  FROM bookings
  WHERE status = 'completed'
  GROUP BY artist_id
) b ON b.artist_id = a.id
ORDER BY r.avg_score DESC,
         total_completed_bookings DESC
LIMIT 10;


**1. Indexes:** I would add an index on `reviews(created_at, artist_id, score)` to help filter reviews from the last 90 days and calculate the average score for each artist. I would also add an index on `bookings(artist_id, status)` to make counting completed bookings faster. These indexes can reduce the amount of data MySQL needs to scan as the tables grow.

**2. Handling large-scale queries:** When the database reaches tens of millions of rows, I would avoid running the full aggregation query on every request. Instead, I would calculate leaderboard statistics periodically and store the results in a summary table, then cache the leaderboard in Redis. This would make requests faster and reduce the load on MySQL. The trade-off is that leaderboard data might be slightly outdated until the next refresh.



## 5 schema issues.

### Problem - 1 --> I could see like there we have to maintain relation between table we have created so, they make an meaningful design for query purposes which is lacking in all the table mentioned. we should use foriegn key in order to make relations among tables.

### Problem - 2 ---> In the bookings table, where there are not restrictions on the type of status where we have given it any type of string value length of 50. even if the value is same it could be UPPERCASE or lowercase characters so, the rules should be more stricts with enums constraints.

### Problem - 3 ---> Apart from the primany keys we do need to maintain proper indexing on the columns we goona make query.

### Problem - 4 ---> The score column in the reviews table does not restrict ratings to a valid range. This could allow users to submit ratings below 1 or above 5, affecting the accuracy of average ratings and leaderboard results. To prevent this, add a CHECK constraint to ensure that every review score is between 1 and 5 using CHECK (score BETWEEN 1 AND 5).

### Problem - 5 ---> There are no strict use of contraints for required field which is make the rule of strictness for that particular column meaningless.