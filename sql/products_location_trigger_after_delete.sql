INSERT INTO products_location_archive (
  `Item Number`,
  `1 Quantity Available`,
  `1 Retail Price`,
  `1 Promotion Price`,
  `2 Quantity Available`,
  `2 Retail Price`,
  `2 Promotion Price`,
  `3 Quantity Available`,
  `3 Retail Price`,
  `3 Promotion Price`,
  `4 Quantity Available`,
  `4 Retail Price`,
  `4 Promotion Price`,
  `5 Quantity Available`,
  `5 Retail Price`,
  `5 Promotion Price`,
  `6 Quantity Available`,
  `6 Retail Price`,
  `6 Promotion Price`,
  `7 Quantity Available`,
  `7 Retail Price`,
  `7 Promotion Price`,
  `8 Quantity Available`,
  `8 Retail Price`,
  `8 Promotion Price`,
  `10 Quantity Available`,
  `10 Retail Price`,
  `10 Promotion Price`,
  `11 Quantity Available`,
  `11 Retail Price`,
  `11 Promotion Price`,
  `12 Quantity Available`,
  `12 Retail Price`,
  `12 Promotion Price`,
  `13 Quantity Available`,
  `13 Retail Price`,
  `13 Promotion Price`,
  `14 Quantity Available`,
  `14 Retail Price`,
  `14 Promotion Price`,
  `15 Quantity Available`,
  `15 Retail Price`,
  `15 Promotion Price`,
  `16 Quantity Available`,
  `16 Retail Price`,
  `16 Promotion Price`,
  `17 Quantity Available`,
  `17 Retail Price`,
  `17 Promotion Price`,
  `18 Quantity Available`,
  `18 Retail Price`,
  `18 Promotion Price`,
  `19 Quantity Available`,
  `19 Retail Price`,
  `19 Promotion Price`,
  `20 Quantity Available`,
  `20 Retail Price`,
  `20 Promotion Price`,
  `21 Quantity Available`,
  `21 Retail Price`,
  `21 Promotion Price`,
  `90 Quantity Available`,
  `90 Retail Price`,
  `90 Promotion Price`,
  `99 Quantity Available`,
  `99 Retail Price`,
  `99 Promotion Price`,
  `valid_from`,
  `valid_to`,
  `op_type`
)
VALUES (
  old.`Item Number`,
  old.`1 Quantity Available`,
  old.`1 Retail Price`,
  old.`1 Promotion Price`,
  old.`2 Quantity Available`,
  old.`2 Retail Price`,
  old.`2 Promotion Price`,
  old.`3 Quantity Available`,
  old.`3 Retail Price`,
  old.`3 Promotion Price`,
  old.`4 Quantity Available`,
  old.`4 Retail Price`,
  old.`4 Promotion Price`,
  old.`5 Quantity Available`,
  old.`5 Retail Price`,
  old.`5 Promotion Price`,
  old.`6 Quantity Available`,
  old.`6 Retail Price`,
  old.`6 Promotion Price`,
  old.`7 Quantity Available`,
  old.`7 Retail Price`,
  old.`7 Promotion Price`,
  old.`8 Quantity Available`,
  old.`8 Retail Price`,
  old.`8 Promotion Price`,
  old.`10 Quantity Available`,
  old.`10 Retail Price`,
  old.`10 Promotion Price`,
  old.`11 Quantity Available`,
  old.`11 Retail Price`,
  old.`11 Promotion Price`,
  old.`12 Quantity Available`,
  old.`12 Retail Price`,
  old.`12 Promotion Price`,
  old.`13 Quantity Available`,
  old.`13 Retail Price`,
  old.`13 Promotion Price`,
  old.`14 Quantity Available`,
  old.`14 Retail Price`,
  old.`14 Promotion Price`,
  old.`15 Quantity Available`,
  old.`15 Retail Price`,
  old.`15 Promotion Price`,
  old.`16 Quantity Available`,
  old.`16 Retail Price`,
  old.`16 Promotion Price`,
  old.`17 Quantity Available`,
  old.`17 Retail Price`,
  old.`17 Promotion Price`,
  old.`18 Quantity Available`,
  old.`18 Retail Price`,
  old.`18 Promotion Price`,
  old.`19 Quantity Available`,
  old.`19 Retail Price`,
  old.`19 Promotion Price`,
  old.`20 Quantity Available`,
  old.`20 Retail Price`,
  old.`20 Promotion Price`,
  old.`21 Quantity Available`,
  old.`21 Retail Price`,
  old.`21 Promotion Price`,
  old.`90 Quantity Available`,
  old.`90 Retail Price`,
  old.`90 Promotion Price`,
  old.`99 Quantity Available`,
  old.`99 Retail Price`,
  old.`99 Promotion Price`,
  old.`updated`,
  NOW(),
  'DELETE'
)