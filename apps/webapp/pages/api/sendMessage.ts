import { NextApiRequest, NextApiResponse } from 'next';
import { AEPSDK } from '@adobe/node-aepcore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { message } = req.body;
        // Handle the message here (e.g., save to database, send an email, etc.)
        console.log('Received message:', message);
        AEPSDK.initialize({
            config: {
                "k": "v"
            },
            logLevel: 3
        }).then(() => {
            AEPSDK.setLogLevel(3);
            console.log('AEPSDK initialized');
            AEPSDK.sendEvent(
                {
                    xdm:
                    {
                        xdmKey: 'xdmVal'
                    },
                    data: {
                        freeformKey: 'freeformVal'
                    }
                }

            );
        });
        res.status(200).json({ message: 'Edge envet was send out.' });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}