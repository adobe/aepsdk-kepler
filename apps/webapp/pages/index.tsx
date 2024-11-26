import "@adobe/platform-browser";
// import {AEPSDK} from "@adobe/js-aepcore";
import {sendEdgeRequest} from "shared-js-component";;

const handleClick2 = async () => {
  try {
    const response = await fetch('/api/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Send Edge request from backend.' }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    alert(`Message sent: ${data.message}`);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send message');
  }
};

const handleClick1 = () => {

  // ------------------ AEPSDK ------------------
  // AEPSDK.initialize({
  //   config: {
  //     "k":"v"
  //   },
  //   logLevel: 3
  // }).then(() => {
  //   AEPSDK.setLogLevel(3);
  //   console.log('AEPSDK initialized');
  //   AEPSDK.sendEvent(
  //     {
  //       xdm :
  //       {
  //         xdmKey: 'xdmVal'
  //       },
  //       data: {
  //         freeformKey: 'freeformVal'
  //       }
  //     }
  
  //   );
  // });
  sendEdgeRequest();
  // ------------------ AEPSDK ------------------
  
};

export default function Index() {

  return (
    <ul>
      <button type="submit" onClick={handleClick1}>Call Edge API in Browser code</button>
      <button type="submit" onClick={handleClick2}>Call Edge API on backend</button>
    </ul>
  );
}
