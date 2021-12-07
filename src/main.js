(function () {
  let currentChannel;
  let channelCount = 0;

  let localConnection;
  let remoteConnection;

  function startup() {
    document
      .getElementById("createDataChannel")
      .addEventListener("click", () => {
        if(currentChannel) {
          const channel = currentChannel;
          channel.close();
        }
        currentChannel = localConnection.createDataChannel(`label-${++channelCount}`);
        setupDataChannel(currentChannel)
      });

    connectPeers();
  }

  function connectPeers() {
    localConnection = new RTCPeerConnection();

    // force a webrtc connection
    localConnection.createDataChannel("dummy");

    remoteConnection = new RTCPeerConnection();
    remoteConnection.ondatachannel = ({ channel }) => {
      setupDataChannel(channel)
    };

    localConnection.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        await remoteConnection.addIceCandidate(candidate);
      }
    };

    remoteConnection.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        await localConnection.addIceCandidate(candidate);
      }
    };

    localConnection
      .createOffer()
      .then((offer) => localConnection.setLocalDescription(offer))
      .then(() =>
        remoteConnection.setRemoteDescription(localConnection.localDescription)
      )
      .then(() => remoteConnection.createAnswer())
      .then((answer) => remoteConnection.setLocalDescription(answer))
      .then(() =>
        localConnection.setRemoteDescription(remoteConnection.localDescription)
      )
      .catch((error) => {
        console.log("Unable to create an offer: " + error.toString());
      });
  }

  function setupDataChannel(channel) {
    channel.onmessage = (message) => {
      console.info("got message", message);
    };

    channel.onopen = () => {
      console.info("data channel [open]", channel.label);
    };

    channel.onclose = () => {
      console.info("data channel [closed]", channel.label);
    };

    channel.onerror = (event) => {
      console.info("data channel [error]", event, channel.label);
    };
  }

  window.addEventListener("load", startup, false);
})();
