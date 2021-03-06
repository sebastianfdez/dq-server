import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Observable } from 'rxjs';
import { BackofficeService } from '../../../shared/services/backoffice.service';
import { SnackBarService } from '../../../../../shared/services/snack-bar.service';
import { DqQuestion } from '../../../../../shared/models/dq-questions';
import { DqTheme } from '../../../../../shared/models/dq-theme';

@Component({
  selector: 'dq-question-detail',
  templateUrl: './dq-question-detail.component.html',
})

export class DqQuestionDetailComponent implements OnInit {
  questionDetailForm$: Observable<FormGroup> = null;

  detailForm: FormGroup = null;

  question$: Observable<Partial<DqQuestion>> = null;

  loading = false;

  loadingNew = false;

  createNew = false;

  questionId = '';

  theme$: Observable<DqTheme> = this.backOfficeService.getSelectedTheme();

  constructor(
    private formBuilder: FormBuilder,
    private backOfficeService: BackofficeService,
    private snackBarService: SnackBarService,
    public router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.question$ = this.route.params.pipe(
      switchMap((params) => {
        if (params.id && params.id !== 'new') {
          this.questionId = params.id;
          return this.backOfficeService.getQuestion(this.questionId);
        }
        this.createNew = true;
        return this.theme$.pipe(map((theme) => ({ theme: theme._id })));
      }),
    );
    this.questionDetailForm$ = this.question$.pipe(
      switchMap((question: DqQuestion) => of(this.createForm(question))),
    );
  }

  addNewQuestion(questionForm: FormGroup): void {
    this.loadingNew = true;
    this.backOfficeService.createNewQuestion(this.getQuestion(questionForm))
      .pipe(
        map((question) => {
          if (question) {
            this.detailForm.markAsPristine();
            this.snackBarService.showMessage('Question created successfully');
            this.router.navigate([`home/themes/${question.theme}/questions`]);
          } else {
            this.snackBarService.showError('Error: Question not created');
          }
        }),
        catchError(() => {
          this.snackBarService.showError('Error: Question not created');
          return of(null);
        }),
      )
      .subscribe(() => {
        this.loadingNew = false;
      });
  }

  editQuestion(newQuestionForm: FormGroup): void {
    this.loadingNew = true;
    this.backOfficeService.editQuestion(this.questionId, {
      theme: newQuestionForm.value.theme,
      text: newQuestionForm.value.text,
      answer1: newQuestionForm.value.answer1,
      answer2: newQuestionForm.value.answer2,
      answer3: newQuestionForm.value.answer3,
      answer4: newQuestionForm.value.answer4,
    }).pipe(
      map((question) => {
        if (question) {
          this.detailForm.markAsPristine();
          this.snackBarService.showMessage('Question edited successfully');
          this.router.navigate([`home/themes/${question.theme}/questions`]);
        } else {
          this.snackBarService.showError('Error: Question not edited');
        }
      }),
      catchError(() => {
        this.snackBarService.showError('Error: Question not edited');
        return of(null);
      }),
    )
      .subscribe(() => {
        this.loadingNew = false;
      });
  }

  getQuestion(newQuestionForm: FormGroup): Partial<DqQuestion> {
    let question: Partial<DqQuestion> = {
      theme: newQuestionForm.value.theme,
      text: newQuestionForm.value.text,
      answer1: newQuestionForm.value.answer1,
      answer2: newQuestionForm.value.answer2,
      answer3: newQuestionForm.value.answer3,
      answer4: newQuestionForm.value.answer4,
    };
    if (newQuestionForm.value.image) {
      // Avoid sending image:null to the backend
      question = {
        ...question,
        image: newQuestionForm.value.image,
      };
    }
    return question;
  }

  createForm(question?: DqQuestion): FormGroup {
    if (!question) {
      this.createNew = true;
    }
    this.detailForm = this.formBuilder.group({
      theme: [question ? question.theme : '', Validators.required],
      text: [question ? question.text : '', Validators.required],
      answer1: [question ? question.answer1 : '', Validators.required],
      answer2: [question ? question.answer2 : '', Validators.required],
      answer3: [question ? question.answer3 : '', Validators.required],
      answer4: [question ? question.answer4 : '', Validators.required],
      image: [question ? question.image : ''],
    });
    this.loading = false;
    return this.detailForm;
  }
}
