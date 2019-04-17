# werewolf_server
Server-side source code of 'Werewolves online'

## Dependencies
 - Expressjs v4
 - mLab/MongoDB/Mongoose
 - Socket.io
 - Axios
 - Connection Pooling (future implementation)

## Database Structure
Below are images showing the database structure of the project. There are two main top-level collections and those are <b>players</b> and <b>rooms</b> collections.

 - <h3>players collection:</h3>
 ![1_eqHrir_-paYBcRjXqDSHxQ](https://user-images.githubusercontent.com/25637330/56312860-ca911480-6159-11e9-91a8-e3138704cfdd.png)
 
for detail info, view <b>playerSchema.js</b> in <b>mongoose-schema</b> folder.


 - <h3>rooms collection:</h3>
 ![1_zyYWFKUhytyQkp4YC80LEQ](https://user-images.githubusercontent.com/25637330/56312939-062bde80-615a-11e9-8552-b792f531bae3.png)
 
 for detail info, view <b>roomSchema.js</b> in <b>mongoose-schema</b> folder.
