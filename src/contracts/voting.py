from pyteal import *
import os

def approval_program():
    handle_creation = Seq(
        App.globalPut(Bytes("go"), Int(0)),
        App.globalPut(Bytes("java"), Int(0)),
        App.globalPut(Bytes("nodejs"), Int(0)),
        Return(Int(1))
    )

    handle_optin = Return(Int(0))
    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))

    scratchCount = ScratchVar(TealType.uint64)
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

    handle_noop = Seq(
        Assert(Global.group_size() == Int(1)),
        Cond(
            [Txn.application_args[0] == Bytes("vote_go"), vote_go],
            [Txn.application_args[0] == Bytes("vote_java"), vote_java],
            [Txn.application_args[0] == Bytes("vote_nodejs"), vote_nodejs]
        )
    )

    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )
    return compileTeal(program, Mode.Application, version=5)

def clear_state_program():
    program = Return(Int(1))
    return compileTeal(program, Mode.Application, version=5)

if __name__ == "__main__":
    path = "./src/contracts"
    with open(os.path.join(path, "voting_approval.teal"), "w") as f:
        f.write(approval_program())
    
    with open(os.path.join(path, "voting_clear.teal"), "w") as f:
        f.write(clear_state_program())