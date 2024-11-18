import { AEPSDK } from "@adobe/browser-aepcore";
const handleClick2 = async () => {
  try {
    const response = await fetch('/api/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Hello from the frontend!' }),
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
  AEPSDK.initialize({
    config: {
      "k":"v"
    },
    logLevel: 3
  }).then(() => {
    AEPSDK.setLogLevel(3);
    console.log('AEPSDK initialized');
    AEPSDK.sendEvent(
      {
        xdm :
        {
          xdmKey: 'xdmVal'
        },
        data: {
          freeformKey: 'freeformVal'
        }
      }
  
    );
  });
  
};

export default function Index() {

  return (
    <ul>
      {/* {data.map((user) => (
        <li key={user.id}>
          <Link href="/user/[id]" as={`/user/${user.id}`}>
            {user.name ?? `User ${user.id}`}
          </Link>
        </li>
      ))} */}
      <button type="submit" onClick={handleClick1}>Call Edge API in Browser code</button>
      <button type="submit" onClick={handleClick2}>Call Edge API on backend</button>
    </ul>
  );
}
