INSERT INTO products_location_secondary_archive (
  `Item Number`,
  `1 Location`,
  `1 Loading Required?`,
  `1 Order Point`,
  `2 Location`,
  `2 Loading Required?`,
  `2 Order Point`,
  `3 Location`,
  `3 Loading Required?`,
  `3 Order Point`,
  `4 Location`,
  `4 Loading Required?`,
  `4 Order Point`,
  `5 Location`,
  `5 Loading Required?`,
  `5 Order Point`,
  `6 Location`,
  `6 Loading Required?`,
  `6 Order Point`,
  `7 Location`,
  `7 Loading Required?`,
  `7 Order Point`,
  `8 Location`,
  `8 Loading Required?`,
  `8 Order Point`,
  `10 Location`,
  `10 Loading Required?`,
  `10 Order Point`,
  `11 Location`,
  `11 Loading Required?`,
  `11 Order Point`,
  `12 Location`,
  `12 Loading Required?`,
  `12 Order Point`,
  `13 Location`,
  `13 Loading Required?`,
  `13 Order Point`,
  `14 Location`,
  `14 Loading Required?`,
  `14 Order Point`,
  `15 Location`,
  `15 Loading Required?`,
  `15 Order Point`,
  `16 Location`,
  `16 Loading Required?`,
  `16 Order Point`,
  `17 Location`,
  `17 Loading Required?`,
  `17 Order Point`,
  `18 Location`,
  `18 Loading Required?`,
  `18 Order Point`,
  `19 Location`,
  `19 Loading Required?`,
  `19 Order Point`,
  `20 Location`,
  `20 Loading Required?`,
  `20 Order Point`,
  `21 Location`,
  `21 Loading Required?`,
  `21 Order Point`,
  `90 Location`,
  `90 Loading Required?`,
  `90 Order Point`,
  `valid_from`,
  `valid_to`,
  `op_type`
)
VALUES (
  old.`Item Number`,
  old.`1 Location`,
  old.`1 Loading Required?`,
  old.`1 Order Point`,
  old.`2 Location`,
  old.`2 Loading Required?`,
  old.`2 Order Point`,
  old.`3 Location`,
  old.`3 Loading Required?`,
  old.`3 Order Point`,
  old.`4 Location`,
  old.`4 Loading Required?`,
  old.`4 Order Point`,
  old.`5 Location`,
  old.`5 Loading Required?`,
  old.`5 Order Point`,
  old.`6 Location`,
  old.`6 Loading Required?`,
  old.`6 Order Point`,
  old.`7 Location`,
  old.`7 Loading Required?`,
  old.`7 Order Point`,
  old.`8 Location`,
  old.`8 Loading Required?`,
  old.`8 Order Point`,
  old.`10 Location`,
  old.`10 Loading Required?`,
  old.`10 Order Point`,
  old.`11 Location`,
  old.`11 Loading Required?`,
  old.`11 Order Point`,
  old.`12 Location`,
  old.`12 Loading Required?`,
  old.`12 Order Point`,
  old.`13 Location`,
  old.`13 Loading Required?`,
  old.`13 Order Point`,
  old.`14 Location`,
  old.`14 Loading Required?`,
  old.`14 Order Point`,
  old.`15 Location`,
  old.`15 Loading Required?`,
  old.`15 Order Point`,
  old.`16 Location`,
  old.`16 Loading Required?`,
  old.`16 Order Point`,
  old.`17 Location`,
  old.`17 Loading Required?`,
  old.`17 Order Point`,
  old.`18 Location`,
  old.`18 Loading Required?`,
  old.`18 Order Point`,
  old.`19 Location`,
  old.`19 Loading Required?`,
  old.`19 Order Point`,
  old.`20 Location`,
  old.`20 Loading Required?`,
  old.`20 Order Point`,
  old.`21 Location`,
  old.`21 Loading Required?`,
  old.`21 Order Point`,
  old.`90 Location`,
  old.`90 Loading Required?`,
  old.`90 Order Point`,
  old.`updated`,
  NOW(),
  'DELETE'
)