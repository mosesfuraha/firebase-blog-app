import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  posts: any[] = [];
  user: any = null;
  newComment: { [key: string]: string } = {};
  selectedPost: any = null; // For Read More modal
  authSubscription!: Subscription;
  showUpdateModal = false;
  showReadMoreModal = false;
  selectUpdate: any = null;

  constructor(
    private blogService: BlogService,
    private authService: AuthService,
    private router: Router,
    private meta: Meta,
    private titleService: Title
  ) {}

  ngOnInit() {
    // Set meta tags for the homepage
    this.titleService.setTitle('Home - Blog Platform');
    this.meta.updateTag({
      name: 'description',
      content:
        'Welcome to the blog platform, where you can read and share amazing blog posts.',
    });

    this.authSubscription = this.authService.isLoggedIn().subscribe((user) => {
      this.user = user;
    });

    // Fetch blog posts from Firestore
    this.blogService.getPosts().subscribe(
      (data) => {
        this.posts = data;
      },
      (error: any) => {
        console.error('Error fetching posts', error);
      }
    );
  }

  // Like a blog post (with user info)
  likePost(id: string, likes: number) {
    if (this.user) {
      const userInfo = {
        displayName: this.user.displayName || 'Anonymous',
        email: this.user.email,
        likedAt: new Date(),
      };

      // Use the BlogService to like the post and pass user info
      this.blogService
        .likePost(id, likes, userInfo)
        .then(() => {
          console.log('Post liked');
        })
        .catch((err: any) => {
          console.error('Error liking post', err);
        });
    }
  }

  // Delete a blog post
  deletePost(id: string) {
    this.blogService
      .deletePost(id)
      .then(() => {
        console.log('Post deleted');
      })
      .catch((err: any) => {
        console.error('Error deleting post', err);
      });
  }

  // Update a blog post (open update modal)
  openUpdateModal(post: any) {
    this.selectUpdate = post; // Set the post for updating
    this.showUpdateModal = true; // Show the update modal
    this.showReadMoreModal = false; // Ensure the Read More modal is hidden
  }

  // Add comment to a post
  addComment(postId: string) {
    if (this.newComment[postId]) {
      const commentData = {
        text: this.newComment[postId],
        createdAt: new Date(),
        displayName: this.user.displayName || 'Anonymous',
        email: this.user.email,
      };

      this.blogService
        .addComment(postId, commentData)
        .then(() => {
          console.log('Comment added');
          this.newComment[postId] = ''; // Clear the input after comment

          // Fetch updated comments to reflect new count
          this.blogService.getComments(postId).subscribe((comments) => {
            this.posts.find((p) => p.id === postId).comments = comments;
          });
        })
        .catch((err: any) => {
          console.error('Error adding comment', err);
        });
    }
  }

  // Read more (Show full post in modal)
  readMore(post: any) {
    this.selectedPost = post; // Set the post for reading more
    this.showReadMoreModal = true; // Show the read more modal
    this.showUpdateModal = false; // Ensure the update modal is hidden
  }

  // Close both Read More and Update modals
  closeModal() {
    this.showUpdateModal = false; // Hide update modal
    this.showReadMoreModal = false; // Hide read more modal
    this.selectedPost = null; // Reset the selected post
  }
  closeUpdateModal() {
    this.showUpdateModal = false;
    this.selectUpdate = null; // Reset the selected post
  }

  // Logout user and redirect to home
  logout() {
    this.authService
      .logout()
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((err: any) => {
        console.error('Logout error', err);
      });
  }

  // Unsubscribe from auth state to avoid memory leaks
  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
