"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react"; // Import Pencil
import { Doc } from "../../../../convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { EditNoteDialog } from "./edit-note-dialog"; // Import new dialog

interface NotePreviewDialogProps {
  note: Doc<"notes">;
}

export function NotePreviewDialog({ note }: NotePreviewDialogProps) {
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("noteId") === note._id;

  const deleteNote = useMutation(api.notes.deleteNote);
  const [deletePending, setDeletePending] = useState(false);
  const [showEdit, setShowEdit] = useState(false); // State for edit mode

  async function handleDelete() {
    setDeletePending(true);
    try {
      await deleteNote({ noteId: note._id });
      toast.success("Note deleted");
      handleClose();
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note. Please try again.");
    } finally {
      setDeletePending(false);
    }
  }

  function handleClose() {
    if (deletePending) return;
    window.history.pushState(null, "", window.location.pathname);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{note.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
            {note.body}
          </div>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowEdit(true)}
            >
              <Pencil size={16} />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
              disabled={deletePending}
            >
              <Trash2 size={16} />
              {deletePending ? "Deleting..." : "Delete Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render Edit Dialog */}
      <EditNoteDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        note={note}
      />
    </>
  );
}
