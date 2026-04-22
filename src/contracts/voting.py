from pyteal import *
import os

# This is a simple voting application where users can vote for their favorite programming language (Go, Java, Node.js).
def approval_program():

    # Initialize global state variables for vote counts
    handle_creation = Seq(
        App.globalPut(Bytes("go"), Int(0)),
        App.globalPut(Bytes("java"), Int(0)),
        App.globalPut(Bytes("nodejs"), Int(0)),
        Return(Int(1))
    ) 

    # For this simple voting app, we don't need to handle opt-in, close-out, update, or delete operations.
    handle_optin = Return(Int(0))
    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))

    # Use a scratch variable to temporarily store the current vote count before updating it.
    scratchCount = ScratchVar(TealType.uint64)

    # Define the logic for handling votes for each programming language. When a user votes, we read the current count from global state, increment it, and write it back.
    vote_go = Seq([
        scratchCount.store(App.globalGet(Bytes("go"))),
        App.globalPut(Bytes("go"), scratchCount.load() + Int(1)),
        Return(Int(1))
    ])

    vote_java = Seq([
        scratchCount.store(App.globalGet(Bytes("java"))),
        App.globalPut(Bytes("java"), scratchCount.load() + Int(1)),
        Return(Int(1))
    ])

    vote_nodejs = Seq([
        scratchCount.store(App.globalGet(Bytes("nodejs"))),
        App.globalPut(Bytes("nodejs"), scratchCount.load() + Int(1)),
        Return(Int(1))
    ])
    # The NoOp handler checks the first application argument to determine which programming language the user is voting for and updates the corresponding vote count.
    handle_noop = Seq(
        Assert(Global.group_size() == Int(1)),
        Cond(
            [Txn.application_args[0] == Bytes("vote_go"), vote_go],
            [Txn.application_args[0] == Bytes("vote_java"), vote_java],
            [Txn.application_args[0] == Bytes("vote_nodejs"), vote_nodejs]
        )
    )

    # The main program logic uses a Cond statement to route different types of transactions (creation, opt-in, close-out, update, delete, and NoOp) to their respective handlers.
    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )
    return compileTeal(program, Mode.Application, version=5)

# The clear state program is simple and just returns 1, indicating that the clear state operation is always successful. In a more complex application, you might want to add logic to handle any necessary cleanup when a user opts out of the application.
def clear_state_program():
    program = Return(Int(1))
    return compileTeal(program, Mode.Application, version=5)

# Finally, we write the approval and clear state programs to separate .teal files in the src/contracts directory. This allows us to easily deploy the application using these compiled TEAL programs.
if __name__ == "__main__":
    path = "./src/contracts"
    with open(os.path.join(path, "voting_approval.teal"), "w") as f:
        f.write(approval_program())
    
    with open(os.path.join(path, "voting_clear.teal"), "w") as f:
        f.write(clear_state_program())