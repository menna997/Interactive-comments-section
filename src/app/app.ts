import { Component } from '@angular/core';
import { CommentsList } from './components/comments-list/comments-list';

@Component({
  selector: 'app-root',
  imports: [CommentsList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
