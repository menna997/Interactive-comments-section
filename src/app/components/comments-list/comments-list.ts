import { Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { CommentsService } from '../../services/comments';

@Component({
  selector: 'app-comments-list',

  imports: [FormsModule],

  templateUrl: './comments-list.html',

  styleUrl: './comments-list.scss',
})
export class CommentsList implements OnInit {
  readonly commentsService = inject(CommentsService);

  comments = this.commentsService.comments;

  replyingToId = signal<number | null>(null);

  replyingToUsername = signal('');

  replyContent = signal('');

  newCommentContent = signal('');

  // ==========================================
  // Edit Comment State
  // ==========================================

  editingCommentId = signal<number | null>(null);

  editedContent = signal('');

  // ==========================================
  // Delete Confirmation State
  // ==========================================

  deleteConfirmationId = signal<number | null>(null);

  // ==========================================
  // Current User Image
  // ==========================================

  currentUserImage = () => this.commentsService.currentUser()?.image.webp ?? '';

  // ==========================================
  // Component Initialization
  // ==========================================

  // Angular calls this lifecycle hook after initializing the component.
  ngOnInit(): void {
    this.commentsService.loadComments();
  }

  // ==========================================
  // Update Comment Score
  // ==========================================
  updateScore(commentId: number, amount: number): void {
    this.commentsService.updateScore(commentId, amount);
  }

  // ==========================================
  // Open Reply Form
  // ==========================================

  // Open the reply form for a comment.
  // commentId identifies the parent comment.
  // username identifies the person being replied to.
  replyTo(commentId: number, username: string): void {
    this.replyingToId.set(commentId);

    this.replyingToUsername.set(username);

    this.replyContent.set('');
  }

  // ==========================================
  // Cancel Reply
  // ==========================================

  // Close the reply form and clear its temporary state.
  cancelReply(): void {
    this.replyingToId.set(null);

    this.replyingToUsername.set('');

    this.replyContent.set('');
  }

  // ==========================================
  // Submit Reply
  // ==========================================

  // Submit a reply under the specified parent comment.
  submitReply(commentId: number): void {
    const content = this.replyContent().trim();

    if (!content) {
      return;
    }

    this.commentsService.addReply(commentId, content, this.replyingToUsername());

    this.cancelReply();
  }

  // ==========================================
  // Submit New Comment
  // ==========================================

  // Add a new comment when the user submits the comment form.
  submitComment(): void {
    const content = this.newCommentContent().trim();

    if (!content) {
      return;
    }

    this.commentsService.addComment(content);

    this.newCommentContent.set('');
  }

  // ==========================================
  // Start Editing a Comment
  // ==========================================

  // Start editing a comment using its ID and current content.
  editComment(id: number, content: string): void {
    this.editingCommentId.set(id);

    this.editedContent.set(content);
  }

  // ==========================================
  // Cancel Editing
  // ==========================================

  // Exit edit mode without saving the changes.
  cancelEdit(): void {
    this.editingCommentId.set(null);

    this.editedContent.set('');
  }

  // ==========================================
  // Save Edited Comment
  // ==========================================

  // Save the edited content for the specified comment.
  saveEdit(id: number): void {
    const content = this.editedContent().trim();

    if (!content) {
      return;
    }

    this.commentsService.updateComment(id, content);

    this.cancelEdit();
  }

  // ==========================================
  // Open Delete Confirmation
  // ==========================================

  // Open the confirmation modal for the selected comment.
  openDeleteConfirmation(commentId: number): void {
    this.deleteConfirmationId.set(commentId);
  }

  // ==========================================
  // Cancel Delete
  // ==========================================

  // Close the delete confirmation modal without deleting anything.
  cancelDelete(): void {
    this.deleteConfirmationId.set(null);
  }

  // ==========================================
  // Confirm Delete
  // ==========================================

  // Delete the selected comment after the user confirms the action.
  confirmDelete(): void {
    const commentId = this.deleteConfirmationId();

    if (commentId === null) {
      return;
    }

    this.commentsService.deleteComment(commentId);

    this.cancelDelete();
  }

  // ==========================================
  // Update Reply Score
  // ==========================================

  updateReplyScore(commentId: number, replyId: number, amount: number): void {
    this.commentsService.updateReplyScore(commentId, replyId, amount);
  }
}
