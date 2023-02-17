Workshop Socket.io
======


Get started
In this workshop, we’ll create a basic chat application.

# Introduction

The goal of this workshop is to set a server that can push messages to clients. Whenever you write a chat message, the idea is that the server will get it and push it to all other connected clients.

# The web framework

The first goal is to set up a simple HTML webpage that serves out a form and a list of messages. We’re going to use the Node.JS web framework ```express``` to this end. Make sure Node.JS is installed.

First let’s create a ```package.json``` manifest file that describes our project. I recommend you place it in a dedicated empty directory (I’ll call mine ```chat-example```).

```javascript
{
  "name": "socket-chat-example",
  "version": "0.0.1",
  "description": "my first socket.io app",
  "dependencies": {}
}
```

Now, in order to easily populate the dependencies property with the things we need, we’ll use npm install:

```javascript
npm install express@4
```

Once it's installed we can create an ```index.js``` file that will set up our application.

```javascript
const app = require('express')();
const http = require('http').Server(app);
const server = http.createServer(app);
const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
```

This means that:

Express initializes ```app``` to be a function handler that you can supply to an HTTP server.
We define a route handler ```/``` that gets called when we hit our website home.
We make the http server listen on port 3000.
If you run ```node index.js``` you should see a message ```Socket.IO server running at http://localhost:${port}/```

And if you point your browser to ```http://localhost:3000:```

You should see our ```Hello world```

# Serving HTML

So far in ```index.js``` we’re calling ```res.send``` and passing it a string of HTML. We're going to create a ```index.html``` file and serve that.

Let’s refactor our route handler to use ```sendFile``` instead.

```javascript
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
```

Put the following in your ```index.html``` file:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Socket.IO chat</title>
    <style>
      body { margin: 0; padding-bottom: 3rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

      #form { background: rgba(0, 0, 0, 0.15); padding: 0.25rem; position: fixed; bottom: 0; left: 0; right: 0; display: flex; height: 3rem; box-sizing: border-box; backdrop-filter: blur(10px); }
      #input { border: none; padding: 0 1rem; flex-grow: 1; border-radius: 2rem; margin: 0.25rem; }
      #input:focus { outline: none; }
      #form > button { background: #333; border: none; padding: 0 1rem; margin: 0.25rem; border-radius: 3px; outline: none; color: #fff; }

      #messages { list-style-type: none; margin: 0; padding: 0; }
      #messages > li { padding: 0.5rem 1rem; }
      #messages > li:nth-child(odd) { background: #efefef; }
    </style>
  </head>
  <body>
    <ul id="messages"></ul>
    <form id="form" action="">
      <input id="input" autocomplete="off" /><button>Send</button>
    </form>
  </body>
</html>
```

If you restart the process (by hitting Control+C and running ```node index.js``` again) and refresh the page it should show you our page with our textbox at the bottom with our send button.

# Integrating Socket.IO

Socket.IO is composed of two parts:

* A server that integrates with (or mounts on) the Node.JS HTTP Server socket.io
* A client library that loads on the browser side socket.io-client<br />


During development, socket.io serves the client automatically for us, as we’ll see, so for now we only have to install one module:

```
npm install socket.io
```

That will install the module and add the dependency to ```package.json```. Now let’s edit ```index.js``` to add it:

```javascript
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
```

Now in index.html add the following snippet before the ```</body>``` (end body tag):

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();
</script>
```

If you now restart the process (by hitting Control+C and running ```node index.js``` again) and then refresh the webpage you should see the console print “a user connected”.

Try opening several tabs, and you’ll see several messages "a user connected"

Each socket also fires a special disconnect event:

```javascript
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
```
Then if you refresh a tab several times you can see multiple disconected message.

# Emitting events

Let’s make it so that when the user types in a message, the server gets it as a chat message event. The script section in index.html should now look as follows:
```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();

  var form = document.getElementById('form');
  var input = document.getElementById('input');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });
</script>
```
And in ```index.js``` we print out the chat message event:

```javascript
io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
});
```
You should see the messages sent inside your terminal.

The total client-side JavaScript code now amounts to:

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  var socket = io();

  var messages = document.getElementById('messages');
  var form = document.getElementById('form');
  var input = document.getElementById('input');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  socket.on('chat message', function(msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
</script>
```

# Improvement

We can improve our application by adding a room management.

For that, create a javascript file ```Users.js``` which create, remove or get a user.

```javascript
const users = [];
 
const addUser = ({id, name, room}) => {
    name = name.trim().toLowerCase();
    room = room.trim().toLowerCase();
 
    const existingUser = users.find((user) => {
        user.room === room && user.name === name
    });
 
    if(existingUser) {
        return{error: "Username is taken"};
    }
    const user = {id,name,room};
    users.push(user);
    return {user};
 
}
 
const removeUser = (id) => {
    const index = users.findIndex((user) => {
        user.id === id
    });
    if(index !== -1) {
        return users.splice(index,1)[0];
    }
}
 
const getUser = (id) => users
        .find((user) => user.id === id);
 
const getUsersInRoom = (room) => users
        .filter((user) => user.room === room);
```

To use it we import users in ```index.js```

```javascript
const { addUser, removeUser, getUser,
  getUsersInRoom } = require("./users");
```

We also add a form in a```index.html``` for the user to fill his name and the channel he wants to join.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Socket.IO chat</title>
    <style>
      body { margin: 0; padding-bottom: 3rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

      #form { background: rgba(0, 0, 0, 0.15); padding: 0.25rem; position: fixed; bottom: 0; left: 0; right: 0; display: flex; height: 3rem; box-sizing: border-box; backdrop-filter: blur(10px); }
      #input { border: none; padding: 0 1rem; flex-grow: 1; border-radius: 2rem; margin: 0.25rem; }
      #input:focus { outline: none; }
      #form > button { background: #333; border: none; padding: 0 1rem; margin: 0.25rem; border-radius: 3px; outline: none; color: #fff; }

      #messages { list-style-type: none; margin: 0; padding: 0; }
      #messages > li { padding: 0.5rem 1rem; }
      #messages > li:nth-child(odd) { background: #efefef; }
      .box { border: 1px solid #ccc; padding: 20px; width: 300px; margin: 20px auto; } 
      .box label { display: block; margin-bottom: 10px; }
      .box input[type="text"] { width: 100%; padding: 5px; margin-bottom: 10px;}
      .box input[type="button"] { display: block; width: 100%; padding: 10px; background-color: #4CAF50; color: #fff;border: none;cursor: pointer;}
    </style>
  </head>
  <body>
    <ul id="messages"></ul>
    <form id="form" action="">
      <input id="input" autocomplete="off" /><button>Send</button>
    </form>
    <div class="box">
      <form id="myForm">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name"><br>
  
        <label for="group">Chanel:</label>
        <input type="text" id="group" name="group"><br>
  
        <input type="button" value="Send" onclick="submitForm()">
      </form>
    </div>
  
    <script src="/socket.io/socket.io.js"></script>

    <script>
      var socket = io();

      var messages = document.getElementById('messages');
      var form = document.getElementById('form');
      var input = document.getElementById('input');

      
      function submitForm() {
      var name = document.getElementById("name").value;
      var group = document.getElementById("group").value;

      var array = [];
      if (name.length < 1 || group.length < 1)
        return;
      array.push({name: name, group: group});
      localStorage.setItem("array", JSON.stringify(array));
      document.getElementById("myForm").reset();
      var name = array[0].name;
      var room = array[0].group;

      if (array.length != 0) {
        var elements = document.getElementsByClassName("box");
        while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
        }
      }
      socket.emit('join',{name, room}, (error) => {
        if(error) {
          alert(error);
        }
        })
      }

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value) {
          socket.emit('chat message', input.value);
          input.value = '';
        }
      });

      socket.on('chat message', function(msg) {
        var item = document.createElement('li');
        item.textContent = msg;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
      });
    </script>
  </body>
</html>
```

We add the ```join``` call in the ```connection``` call inside the ```index.js```
```javascript
  socket.on('join', ({ name, room }) => {
      const { error, user } = addUser(
      { id: socket.id, name, room });
      console.log(`${name} is connected inside room: ${room}`);
      
      socket.emit('chat message',
      `${user.name}, welcome to the room ${user.room}.`);

      socket.broadcast.to(user.room)
      .emit('chat message', `${user.name}, has joined.`);
      socket.join(user.room);
  });
```

We can also modify the disconect management.

```javascript
  socket.on('disconnect', () => {
    const user = getUser(socket.id);
    if (user) {
      console.log(`user disconnected the ${user.room} room.`);
      io.to(user.room).emit('chat message', `${user.name} is now offline. Bye !`);
    }
  });
```

Finaly, our ```index.js``` should look like this for the message sent inside a specific room.
```javascript
io.on('connection', (socket) => {
  socket.on('join', ({ name, room }) => {
      const { error, user } = addUser(
      { id: socket.id, name, room });
      console.log(`${name} is connected inside room: ${room}`);
      
      socket.emit('chat message',
      `${user.name}, welcome to the room ${user.room}.`);

      socket.broadcast.to(user.room)
      .emit('chat message', `${user.name}, has joined.`);
      socket.join(user.room);


    });
    socket.on('disconnect', () => {
      const user = getUser(socket.id);
      if (user) {
        console.log(`user disconnected the ${user.room} room.`);
        io.to(user.room).emit('chat message', `${user.name} is now offline. Bye !`);
      }
    });
    socket.on('chat message', msg => {
    const user = getUser(socket.id);
    io.to(user.room).emit('chat message', `${user.name} said : ${msg}`);
    });
  });
 ```

And that completes our chat application with the room management.
