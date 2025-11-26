/**
 * Generate a consistent color for a user based on their ID
 */
function getUserColor(userId) {
    const colors = [
        { bg: 'bg-amber-500', text: 'text-black' },
        { bg: 'bg-emerald-500', text: 'text-black' },
        { bg: 'bg-blue-500', text: 'text-white' },
        { bg: 'bg-purple-500', text: 'text-white' },
        { bg: 'bg-pink-500', text: 'text-white' },
        { bg: 'bg-cyan-500', text: 'text-black' },
        { bg: 'bg-orange-500', text: 'text-black' },
        { bg: 'bg-rose-500', text: 'text-white' },
    ];
    return colors[userId % colors.length];
}

/**
 * Active Users Component - Shows who's currently editing
 */
export default function ActiveUsers({ users = [], currentUserId }) {
    if (users.length === 0) {
        return (
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
                Only you
            </div>
        );
    }

    const otherUsers = users.filter(u => u.id !== currentUserId);
    const totalCount = users.length;

    return (
        <div className="flex items-center gap-3">
            {/* User count */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{totalCount} online</span>
            </div>
            
            {/* Avatar stack */}
            <div className="flex -space-x-2">
                {users.slice(0, 5).map((user, index) => {
                    const color = getUserColor(user.id);
                    const isYou = user.id === currentUserId;
                    
                    return (
                        <div
                            key={user.id}
                            className="relative group"
                            style={{ zIndex: 10 - index }}
                        >
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center 
                                    text-xs font-semibold border-2 border-zinc-900
                                    transition-transform hover:scale-110 hover:z-20
                                    ${color.bg} ${color.text}
                                    ${isYou ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-zinc-900' : ''}
                                `}
                            >
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Tooltip */}
                            <div className="
                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                px-2.5 py-1.5 bg-zinc-800 text-white text-xs rounded-lg
                                opacity-0 group-hover:opacity-100 transition-all duration-200
                                whitespace-nowrap pointer-events-none shadow-lg
                                border border-zinc-700
                                -translate-y-1 group-hover:translate-y-0
                            ">
                                {user.name}
                                {isYou && <span className="text-amber-500 ml-1">(you)</span>}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                    <div className="border-4 border-transparent border-t-zinc-800"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {users.length > 5 && (
                    <div className="
                        w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center 
                        text-xs font-medium text-zinc-300 border-2 border-zinc-900
                    ">
                        +{users.length - 5}
                    </div>
                )}
            </div>
        </div>
    );
}
