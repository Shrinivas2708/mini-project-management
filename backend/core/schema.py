import graphene
from graphene_django import DjangoObjectType
from .models import Organization, Project, Task, TaskComment

# --- 1. Types ---

class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = "__all__"

class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = "__all__"

class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = "__all__"

class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = "__all__"
    
    task_count = graphene.Int()
    completed_task_count = graphene.Int()

    def resolve_task_count(self, info):
        return self.tasks.count()

    def resolve_completed_task_count(self, info):
        return self.tasks.filter(status='DONE').count()

# --- 2. Mutations (Must be defined BEFORE the Mutation class below) ---

class CreateProject(graphene.Mutation):
    class Arguments:
        org_slug = graphene.String(required=True)
        name = graphene.String(required=True)
        description = graphene.String()
        due_date = graphene.Date()

    project = graphene.Field(ProjectType)

    def mutate(self, info, org_slug, name, description="", due_date=None):
        org = Organization.objects.get(slug=org_slug)
        project = Project.objects.create(
            organization=org, name=name, description=description, due_date=due_date
        )
        return CreateProject(project=project)

class CreateTask(graphene.Mutation):
    class Arguments:
        project_id = graphene.ID(required=True)
        title = graphene.String(required=True)
        assignee_email = graphene.String()

    task = graphene.Field(TaskType)

    def mutate(self, info, project_id, title, assignee_email=""):
        project = Project.objects.get(pk=project_id)
        task = Task.objects.create(
            project=project, title=title, assignee_email=assignee_email
        )
        return CreateTask(task=task)

class UpdateTaskStatus(graphene.Mutation):
    class Arguments:
        task_id = graphene.ID(required=True)
        status = graphene.String(required=True)

    task = graphene.Field(TaskType)

    def mutate(self, info, task_id, status):
        task = Task.objects.get(pk=task_id)
        task.status = status
        task.save()
        return UpdateTaskStatus(task=task)

class AddComment(graphene.Mutation):
    class Arguments:
        task_id = graphene.ID(required=True)
        content = graphene.String(required=True)
        author_email = graphene.String(required=True)

    comment = graphene.Field(TaskCommentType)

    def mutate(self, info, task_id, content, author_email):
        task = Task.objects.get(pk=task_id)
        comment = TaskComment.objects.create(
            task=task, content=content, author_email=author_email
        )
        return AddComment(comment=comment)

class UpdateProjectStatus(graphene.Mutation):
    class Arguments:
        project_id = graphene.ID(required=True)
        status = graphene.String(required=True)

    project = graphene.Field(ProjectType)

    def mutate(self, info, project_id, status):
        project = Project.objects.get(pk=project_id)
        project.status = status
        project.save()
        return UpdateProjectStatus(project=project)

# --- 3. Main Schema (Uses the classes defined above) ---

class Query(graphene.ObjectType):
    projects = graphene.List(ProjectType, org_slug=graphene.String(required=True))
    project = graphene.Field(ProjectType, id=graphene.ID(required=True))
    task = graphene.Field(TaskType, id=graphene.ID(required=True))

    def resolve_projects(self, info, org_slug):
        return Project.objects.filter(organization__slug=org_slug).order_by('-created_at')

    def resolve_project(self, info, id):
        return Project.objects.get(pk=id)
    
    def resolve_task(self, info, id):
        return Task.objects.get(pk=id)

class Mutation(graphene.ObjectType):
    create_project = CreateProject.Field()
    create_task = CreateTask.Field()
    update_task_status = UpdateTaskStatus.Field()
    add_comment = AddComment.Field()
    update_project_status = UpdateProjectStatus.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)