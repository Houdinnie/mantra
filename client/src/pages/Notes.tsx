import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Trash2, Pin, Save, X, Brain } from "lucide-react";
import { StreamingMath } from "@/components/MathRenderer";

type Note = {
  id: number;
  title: string;
  content: string;
  tags: string | null;
  pinned: boolean;
  updatedAt: Date;
};

export default function Notes() {
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const notesQuery = trpc.notes.list.useQuery({ search: search || undefined });
  const createMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      notesQuery.refetch();
      setIsCreating(false);
      setNewTitle("");
    },
  });
  const updateMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      notesQuery.refetch();
      setIsEditing(false);
    },
  });
  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      notesQuery.refetch();
      setSelectedNote(null);
    },
  });

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (!selectedNote) return;
    updateMutation.mutate({
      id: selectedNote.id,
      title: editTitle,
      content: editContent,
    });
    setSelectedNote({
      ...selectedNote,
      title: editTitle,
      content: editContent,
    });
  };

  const tags = (note: Note) => note.tags?.split(",").filter(Boolean) ?? [];

  return (
    <div className="h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900/60 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-lg">Notes</h2>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="pl-9 bg-slate-800 border-slate-700 text-sm"
            />
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> New Note
          </Button>
        </div>

        {isCreating && (
          <div className="p-3 border-b border-slate-800 bg-slate-800/50">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Note title..."
              className="bg-slate-700 border-slate-600 mb-2 text-sm"
              autoFocus
              onKeyDown={e =>
                e.key === "Enter" &&
                newTitle.trim() &&
                createMutation.mutate({ title: newTitle, content: "" })
              }
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  createMutation.mutate({ title: newTitle, content: "" })
                }
                disabled={!newTitle.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreating(false)}
                className="text-slate-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {notesQuery.data?.map(note => (
              <button
                key={note.id}
                onClick={() => selectNote(note as Note)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedNote?.id === note.id ? "bg-purple-600/20 border border-purple-500/50" : "hover:bg-slate-800/50 border border-transparent"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      {note.pinned && (
                        <Pin className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      )}
                      {note.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                    {tags(note as Note).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags(note as Note)
                          .slice(0, 2)
                          .map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {notesQuery.data?.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">
                No notes yet.
                <br />
                Create your first note above.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedNote ? (
          <>
            <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/30">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="text-xl font-bold bg-transparent border-slate-600 max-w-lg"
                />
              ) : (
                <h1 className="text-xl font-bold">{selectedNote.title}</h1>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateMutation.mutate({
                      id: selectedNote.id,
                      pinned: !selectedNote.pinned,
                    })
                  }
                  className={
                    selectedNote.pinned ? "text-purple-400" : "text-slate-500"
                  }
                >
                  <Pin className="w-4 h-4" />
                </Button>
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      disabled={updateMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:text-white"
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate({ id: selectedNote.id })}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full h-full bg-transparent text-slate-100 resize-none outline-none font-mono text-sm leading-relaxed"
                  placeholder="Start writing in markdown..."
                />
              ) : (
                <div className="max-w-3xl mx-auto prose prose-invert prose-slate">
                  {selectedNote.content ? (
                    <StreamingMath>{selectedNote.content}</StreamingMath>
                  ) : (
                    <p className="text-slate-500 italic">
                      Empty note — click Edit to start writing.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Brain className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-700 mb-2">
                Your Knowledge Base
              </h2>
              <p className="text-slate-600">
                Select a note or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
