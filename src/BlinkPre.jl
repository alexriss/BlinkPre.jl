__precompile__()

module BlinkPre

using Reexport
using Distributed: Future
using Sockets
using Logging
using Base64: stringmime
using WebIO

include("rpc/rpc.jl")
include("content/content.jl")

include("AtomShell/AtomShell.jl")
export AtomShell
@reexport using .AtomShell
import .AtomShell: resolve_blink_asset

end # module


# Blink.jl -> BlinkPre.jl
# replace module name
# replace all references of `Blink` with `BlinkPre` across all files
# also in the js files