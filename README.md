## Introduction
This served as the backend of one of my previous assignment in this [repo](https://github.com/zyucong/instacram).

It is now deployed in https://myic.t66y.cf. Some interesting username/password pair you can try: Emma/taste, Mia/pan, Andrew/overrated. 

Could be a bit slow. Because I deployed the api endpoints and the db in different locations for convenient reasons, and I am short of time to adjust it unfortunately.

## Major Change
* Using Node.js with express instead of using flask in the previous version.
* Using MongoDB instead of SQLite, since MongoDB is more general and the original one is not relational at all. 

## What remains to be done
Well there are a bunch of things that I need to work on it to make it better. The most important issue comes first.

~~* Implement /post endpoint, currently I have only done the /auth (to login, signup), and /user endpoint.~~
(Solved!)
* Remove token stored in the database. It is dangerous and not necessary to keep them there. Remove thumbnail stored in the database, it is tedious to convert the data urls to smaller size images. And it is not being used by the frontend.
* Implement some testing. It is seldom mentioned in university but it is important in industry. Discard the tedious console.log() for something real. The backend logic has been tested to be workable as an assignment so I don't need to worry about it when I built it. But I still need some testing.

~~* Add SSL to the webpage. Firefox gives me warning when I tried to enter password to login :(~~
(Solved!)
* Host the frontend somewhere else closer to where the backend is deployed. To see why the delay exists and how to eliminate it.(Errrrr, partially solved)
* Store the hash instead of the password as it is in the database. However as a demo project it might end up with a bunch of dead users that I can access because I don't know their passwords. Anyway I will have to find somewhere to store their real passwords. Not urgent.
* Change the format of document id and the storage of id relation. It is not a good idea to store document id with auto-increment primary id like SQLite. MongoDB is gonna to generate a unique string as id. And to replace the storage of following ids as an array instead of a string. However it might be hard to see who that user has followed in debug process. Not urgent at all.
