import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChurchInfoFormComponent } from './church-info-form.component';

describe('ChurchInfoFormComponent', () => {
  let component: ChurchInfoFormComponent;
  let fixture: ComponentFixture<ChurchInfoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChurchInfoFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChurchInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
