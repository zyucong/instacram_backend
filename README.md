## Introduction
This can be used as the backend of one of my previous assignment in this [repo](https://github.com/zyucong/instacram).

It is now deployed in http://shuangji666.info. Some interesting username/password pair you can try: Emma/taste, Mia/pan

For some reason it is painfully slow but it does work. Maybe that's because I put the frontend on a VPS in Australia and deploy the backend with Heroku which is located in USA? Hopefully I can solve this issue later.

## Major Change
* Using Node.js with express instead of using flask in the previous version.
* Using MongoDB instead of SQLite, since MongoDB is more general and the original one is not relational at all. 

## What remains to be done
Well there are a bunch of things that I need to work on it to make it better. The most important issue comes first.

* Implement /post endpoint, currently I have only done the /auth (to login, signup), and /user endpoint.
* To remove token stored in the database. It is dangerous and not necessary to keep them there.
* Implement some testing. It is seldom mentioned in university but it is important in industry. Discard the tedious console.log() for something real. The backend logic has been tested to be workable as an assignment so I don't need to worry about it when I built it. But I still need some testing.
* Add SSL to the webpage. Firefox gives me warning when I tried to enter password to login :(
* Host the frontend somewhere else closer to where the backend is deployed. To see why the delay exists and how to eliminate it.
* Store the hash instead of the password as it is in the database. However as a demo project it might end up with a bunch of dead users that I can access because I don't know their passwords. Anyway I will have to find somewhere to store their read passwords. Not urgent.
* Change the format of document id and the storage of id relation. It is not a good idea to store document id with auto-increment primary id like SQLite. MongoDB is gonna to generate a unique string as id. And to replace the storage of following ids as an array instead of a string. However it might be hard to see who that user has followed in debug process. Not urgent at all.
