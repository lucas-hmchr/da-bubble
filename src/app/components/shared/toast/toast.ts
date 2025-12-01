import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { ToastModel } from './../../../models/toast.model'

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  private toastService = inject(ToastService);

  toast = computed<ToastModel | null>(() => this.toastService.toast());
  isClosing = computed(() => this.toastService.isClosing());

  hide() {
    this.toastService.hide();
  }
}
