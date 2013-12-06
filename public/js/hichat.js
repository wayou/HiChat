//Create a chat module to use.
(function() {

  var nickname=prompt("Set nickname");
  $('#nickname').val(nickname);
  
  window.hiChat = {
    socket: null,

    initialize: function(socketURL) {
      this.socket = io.connect(socketURL);

      //Send message on button click or enter
      $('#sendMessage').click(function() {
        hiChat.send();
      });

      $('#message').keyup(function(e) {
//enter to submit msg, shift+enter key to line break
        if (e.which == 13 && e.shiftKey) {

        } else if (e.which == 13) {
          hiChat.send();
          e.preventDefault();
        }
      });

      //Process any incoming messages
      this.socket.on('new', this.add);
    },

    //Adds a new message to the chat.
    add: function(data) {
      var name = data.name || 'anonymous';
      var msg = $('<div class="msg"></div>').append('<span class="name">' + name + '</span>: ').append('<span class="text">' + data.msg + '</span>');

      $('#messages').append(msg).animate({
        scrollTop: $('#messages').prop('scrollHeight')
      }, 0);
    },

    //Sends a message to the server,
    //then clears it from the textarea
    send: function() {
      this.socket.emit('msg', {
        name: $('#nickname').val(),
        msg: $('#message').val(),
      });

      $('#message').val('');
    }
  };
}());