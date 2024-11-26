import { NextApiRequest, NextApiResponse } from 'next';
import '@adobe/platform-node';
// import { AEPSDK } from '@adobe/js-aepcore';
import { sendEdgeRequest } from "shared-js-component";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { message } = req.body;
        // Handle the message here (e.g., save to database, send an email, etc.)
        console.log('Received message:', message);
        // ------------------ AEPSDK ------------------
        // AEPSDK.initialize({
        //     config: {
        //         "k": "v"
        //     },
        //     logLevel: 3
        // }).then(() => {
        //     AEPSDK.setLogLevel(3);
        //     console.log('AEPSDK initialized');
        //     AEPSDK.sendEvent(
        //         {
        //             xdm:
        //             {
        //                 xdmKey: 'xdmVal'
        //             },
        //             data: {
        //                 freeformKey: 'freeformVal'
        //             }
        //         }

        //     );
        // });
        sendEdgeRequest();
        // ------------------ AEPSDK ------------------

        res.status(200).json({ message: 'Edge envet was send out.' });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}