import { auth } from '@/lib/auth'
import { Metadata } from 'next';
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

export const metadata: Metadata = {
    title: 'New Conversation | Luna',
    description: 'Start a new conversation with Luna AI medical assistant.',
}

async function layout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect('/')
    }

return (
    <div>
        {children}
    </div>
)
}

export default layout