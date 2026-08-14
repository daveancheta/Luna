import React from 'react'
import { Skeleton } from './ui/skeleton'

function MessageSkeleton() {
    return (
        <div className="flex-1 overflow-y-auto">
            {Array.from({ length: 3 }).map((_, index) =>
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 md:px-6" key={index}>
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-48 rounded-3xl" />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MessageSkeleton