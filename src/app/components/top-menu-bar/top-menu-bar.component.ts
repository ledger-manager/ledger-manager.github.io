import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { AvatarModule } from 'primeng/avatar';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-top-menu-bar',
  templateUrl: './top-menu-bar.component.html',
  styleUrls: ['./top-menu-bar.component.scss'],
  imports: [MenubarModule, AvatarModule]
})
export class TopMenuBarComponent {
  @Input() pageTitle: string = '';
  @Input() userName: string = '';
  @Output() logout = new EventEmitter<void>();

  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      { label: 'Home', icon: 'pi pi-home', routerLink: '/' }
    ];
  }

  onLogout() {
    this.logout.emit();
  }
}
