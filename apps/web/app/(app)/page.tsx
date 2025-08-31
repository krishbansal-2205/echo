'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import { api } from '@workspace/backend/_generated/api';
import { useQuery } from 'convex/react';

export default function Page() {
   const users = useQuery(api.users.getMany);

   return (
      <div className='flex flex-col items-center justify-center min-h-svh'>
         <p>apps/web</p>
         <UserButton />
         <OrganizationSwitcher />
      </div>
   );
}
