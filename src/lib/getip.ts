
import dns from 'dns';

export default async function getIP(hostname: string) {
    let obj = await dns.promises.lookup(hostname)
        .catch((e: any) => {
            console.error(e.message || e);
        });

    return obj?.address;
}