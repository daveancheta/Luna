import { Skeleton } from "./ui/skeleton"

function NavUserSkeleton() {
    return (
        <div className='flex flex-row items-center gap-2 p-2 rounded-md'>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="grid flex-1 gap-1.5 text-left">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="ml-auto size-4 shrink-0 rounded-sm" />
        </div>
    )
}

export default NavUserSkeleton