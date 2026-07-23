import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { Languages, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  city: string;
  likes: string[];
  dislikes: string[];
  commentedon: string;
}

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "gu", label: "Gujarati" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
];

const hasBlockedCharacters = (value: string) =>
  /[^\p{L}\p{M}\p{N}\s]/u.test(value);

const Comments = ({ videoId }: { videoId: string | string[] | undefined }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translationLanguage, setTranslationLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (!videoId) return;
    axiosInstance
      .get(`/comment/${videoId}`)
      .then((response) => setComments(response.data))
      .catch(() => toast.error("Comments could not be loaded"))
      .finally(() => setLoading(false));
  }, [videoId]);

  const validate = (value: string) => {
    if (!value.trim()) return "Comment cannot be empty";
    if (hasBlockedCharacters(value.trim())) {
      return "Special characters are not allowed";
    }
    return "";
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const error = validate(newComment);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        commentbody: newComment,
      });
      setComments((current) => [response.data, ...current]);
      setNewComment("");
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || "Comment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async () => {
    const error = validate(editText);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const response = await axiosInstance.patch(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      setComments((current) =>
        current.map((item) =>
          item._id === editingCommentId ? response.data : item
        )
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/comment/deletecomment/${id}`);
      setComments((current) => current.filter((item) => item._id !== id));
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || "Delete failed");
    }
  };

  const handleReaction = async (id: string, type: "like" | "dislike") => {
    if (!user) {
      toast.error("Sign in to react");
      return;
    }

    try {
      const response = await axiosInstance.post(`/comment/${id}/reaction`, {
        type,
      });
      if (response.data.removed) {
        setComments((current) => current.filter((item) => item._id !== id));
        toast.info("Comment removed after receiving two dislikes");
      } else {
        setComments((current) =>
          current.map((item) => (item._id === id ? response.data : item))
        );
      }
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || "Reaction failed");
    }
  };

  const handleTranslate = async (id: string) => {
    try {
      const response = await axiosInstance.post(`/comment/${id}/translate`, {
        target: translationLanguage,
      });
      setTranslations((current) => ({
        ...current,
        [id]: response.data.translatedText,
      }));
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || "Translation failed");
    }
  };

  if (loading) {
    return <div className="animate-pulse text-sm text-gray-500">Loading comments...</div>;
  }

  return (
    <section id="comments" className="space-y-6 scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{comments.length} Comments</h2>
        <label className="flex items-center gap-2 text-sm">
          Translate to
          <select
            value={translationLanguage}
            onChange={(event) => setTranslationLanguage(event.target.value)}
            className="rounded-md border bg-white px-2 py-1 dark:bg-slate-900"
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {user && (
        <div className="flex gap-3 sm:gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment using letters and numbers only..."
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              maxLength={500}
              className="min-h-[80px] resize-none rounded-none border-0 border-b-2 focus-visible:ring-0"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm italic text-gray-500">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          comments.map((comment) => {
            const ownComment = comment.userid === user?._id;
            return (
              <article key={comment._id} className="flex gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>
                    {comment.usercommented?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.usercommented}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {comment.city}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.commentedon))} ago
                    </span>
                  </div>

                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(event) => setEditText(event.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button onClick={handleUpdateComment}>Save</Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="break-words text-sm">{comment.commentbody}</p>
                      {translations[comment._id] && (
                        <p className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                          {translations[comment._id]}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={ownComment}
                          onClick={() => handleReaction(comment._id, "like")}
                        >
                          <ThumbsUp className="mr-1 h-4 w-4" />
                          {comment.likes?.length || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={ownComment}
                          onClick={() => handleReaction(comment._id, "dislike")}
                        >
                          <ThumbsDown className="mr-1 h-4 w-4" />
                          {comment.dislikes?.length || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTranslate(comment._id)}
                        >
                          <Languages className="mr-1 h-4 w-4" />
                          Translate
                        </Button>
                        {ownComment && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditText(comment.commentbody);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(comment._id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Comments;
