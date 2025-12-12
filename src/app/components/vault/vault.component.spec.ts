import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { VaultComponent } from './vault.component';
import { FirebaseService } from '../../services/firebase.service';
import { CryptoService } from '../../services/crypto.service';
import { AutoLockService } from '../../services/auto-lock.service';

describe('VaultComponent', () => {
  let component: VaultComponent;
  let fixture: ComponentFixture<VaultComponent>;
  let firebaseService: jasmine.SpyObj<FirebaseService>;
  let cryptoService: jasmine.SpyObj<CryptoService>;
  let autoLockService: jasmine.SpyObj<AutoLockService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const firebaseSpy = jasmine.createSpyObj('FirebaseService', ['logout', 'loadEntries', 'saveEntry']);
    const cryptoSpy = jasmine.createSpyObj('CryptoService', ['encryptWithMaster', 'decryptEntry', 'generatePassword']);
    const autoLockSpy = jasmine.createSpyObj('AutoLockService', ['getMaster']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VaultComponent],
      providers: [
        { provide: FirebaseService, useValue: firebaseSpy },
        { provide: CryptoService, useValue: cryptoSpy },
        { provide: AutoLockService, useValue: autoLockSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VaultComponent);
    component = fixture.componentInstance;
    firebaseService = TestBed.inject(FirebaseService) as jasmine.SpyObj<FirebaseService>;
    cryptoService = TestBed.inject(CryptoService) as jasmine.SpyObj<CryptoService>;
    autoLockService = TestBed.inject(AutoLockService) as jasmine.SpyObj<AutoLockService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock the master password
    autoLockService.getMaster.and.returnValue('test_master_password');
    // Mock the user
    firebaseService.auth = { currentUser: { uid: 'test_uid' } } as any;
    // Mock loadEntries
    firebaseService.loadEntries.and.returnValue(Promise.resolve([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('logout', () => {
    it('should call firebaseService.logout and router.navigate', () => {
      component.logout();
      expect(firebaseService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('ngOnInit', () => {
    it('should navigate to / if master password is not set', async () => {
      autoLockService.getMaster.and.returnValue('');
      await component.ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
