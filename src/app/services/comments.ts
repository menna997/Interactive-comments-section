import { Injectable, effect, inject, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Comment, CommentsData, User } from '../model/comment.model';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private readonly http = inject(HttpClient);

  private readonly storageKey = 'interactive-comments-data';

  private hasLoaded = false;

  private loading = false;

  // ==========================================
  // Reactive State
  // ==========================================

  readonly comments = signal<Comment[]>([]);

  readonly currentUser = signal<User | null>(null);

  readonly loadingError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const comments = this.comments();

      const currentUser = this.currentUser();

      if (!this.hasLoaded || typeof localStorage === 'undefined' || !currentUser) {
        return;
      }

      try {
        localStorage.setItem(this.storageKey, JSON.stringify({ currentUser, comments }));
      } catch (error) {
        console.error('Failed to save comments:', error);
      }
    });
  }

  // ==========================================
  // Load Initial Comments
  // ==========================================

  loadComments(): void {
    if (this.hasLoaded || this.loading) {
      return;
    }

    this.loading = true;

    if (this.loadFromStorage()) {
      this.finishLoading();
      return;
    }
    this.http.get<CommentsData>('/data.json').subscribe({
      next: (data) => {
        this.currentUser.set(data.currentUser);

        this.comments.set(data.comments);

        this.finishLoading();
      },

      error: (error) => {
        console.error('Failed to load comments:', error);

        this.loadingError.set('Failed to load comments.');

        this.loading = false;
      },
    });
  }

  // ==========================================
  // Restore Data from localStorage
  // ==========================================

  private loadFromStorage(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    try {
      const savedData = localStorage.getItem(this.storageKey);

      if (!savedData) {
        return false;
      }

      const data: unknown = JSON.parse(savedData);
      if (!this.isValidData(data)) {
        localStorage.removeItem(this.storageKey);

        return false;
      }

      this.currentUser.set(data.currentUser);

      this.comments.set(data.comments);

      return true;
    } catch (error) {
      console.error('Failed to read saved comments:', error);

      return false;
    }
  }

  // ==========================================
  // Validate Saved Data
  // ==========================================

  private isValidData(data: unknown): data is CommentsData {
    // Reject null values and values that are not objects.
    if (!data || typeof data !== 'object') {
      return false;
    }

    const value = data as Record<string, unknown>;
    return (
      !!value['currentUser'] &&
      typeof value['currentUser'] === 'object' &&
      Array.isArray(value['comments'])
    );
  }

  // ==========================================
  // Finish Loading
  // ==========================================

  private finishLoading(): void {
    this.hasLoaded = true;
    this.loading = false;
    this.loadingError.set(null);
  }

  // ==========================================
  // Update Comment Score
  // ==========================================

  updateScore(commentId: number, amount: number): void {
    this.comments.update((comments) =>
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,

              score: Math.max(0, comment.score + amount),
            }
          : comment,
      ),
    );
  }

  // ==========================================
  // Update Reply Score
  // ==========================================

  updateReplyScore(commentId: number, replyId: number, amount: number): void {
    // Update the comments signal using its current value.
    this.comments.update((comments) =>
      // Create a new array of comments.
      comments.map((comment) =>
        // Find the parent comment that contains the target reply.
        comment.id === commentId
          ? {
              // Copy the existing parent comment properties.
              ...comment,

              // Create a new replies array for the selected comment.
              replies: comment.replies.map((reply) =>
                // Find the reply whose ID matches replyId.
                reply.id === replyId
                  ? {
                      // Copy the existing reply properties.
                      ...reply,

                      // Apply the score change without allowing negative scores.
                      score: Math.max(0, reply.score + amount),
                    }
                  : // Keep every other reply unchanged.
                    reply,
              ),
            }
          : // Keep every other comment unchanged.
            comment,
      ),
    );
  }

  // ==========================================
  // Add New Comment
  // ==========================================

  addComment(content: string): void {
    const user = this.currentUser();

    if (!user || !this.hasLoaded) {
      return;
    }

    const newComment: Comment = {
      id: this.createId(),

      content,

      createdAt: 'Just now',

      score: 0,

      user,

      replies: [],
    };

    this.comments.update((comments) => [...comments, newComment]);
  }

  // ==========================================
  // Add Reply to a Comment
  // ==========================================

  addReply(commentId: number, content: string, replyingTo: string): void {
    // Read the currently logged-in user.
    const user = this.currentUser();

    // Do not add a reply if there is no user
    // or if the initial data has not finished loading.
    if (!user || !this.hasLoaded) {
      return;
    }

    // Update the comments signal by creating a new comments array.
    this.comments.update((comments) =>
      // Find the parent comment that should receive the reply.
      comments.map((comment) =>
        // Only modify the comment whose ID matches commentId.
        comment.id === commentId
          ? {
              // Copy the existing parent comment properties.
              ...comment,

              // Create a new replies array that keeps existing replies
              // and appends the newly created reply.
              replies: [
                ...comment.replies,
                {
                  // Generate an ID for the new reply.
                  id: this.createId(),

                  // Store the reply text.
                  content,

                  // Display the creation time as "Just now".
                  createdAt: 'Just now',

                  // Give the new reply an initial score of zero.
                  score: 0,

                  // Store the username being replied to.
                  replyingTo,

                  // Assign the current user as the reply author.
                  user,
                },
              ],
            }
          : // Keep all other comments unchanged.
            comment,
      ),
    );
  }

  // ==========================================
  // Edit an Existing Comment
  // ==========================================

  updateComment(commentId: number, content: string): void {
    this.comments.update((comments) =>
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              content,
            }
          : comment,
      ),
    );
  }

  // ==========================================
  // Delete a Comment
  // ==========================================

  deleteComment(commentId: number): void {
    this.comments.update((comments) => comments.filter((comment) => comment.id !== commentId));
  }

  // ==========================================
  // Generate an ID
  // ==========================================

  private createId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}
