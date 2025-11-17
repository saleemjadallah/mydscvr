# VisaDocs AI - Unified Dashboard with Jeffrey
## All Services + AI Guide in One Cohesive Experience

> **Design Philosophy**: Jeffrey isn't a separate tab - he's your AI companion throughout your entire visa journey, always present in the sidebar, contextually aware of what you're doing.

---

## 🎯 The Unified Vision

Instead of 4 separate tools, we create **ONE intelligent dashboard** where:
- Jeffrey (AI chat) is **always visible** in a persistent sidebar
- All 4 services are seamlessly integrated as "workflows"
- Jeffrey guides you through each workflow contextually
- Progress is tracked centrally across all services
- Documents, photos, and data flow between services automatically

---

## 🏗️ Dashboard Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Navigation Bar (Logo, User Menu, Notifications)           │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│                │         MAIN CONTENT AREA                      │
│   JEFFREY      │    (Dynamic based on selected workflow)       │
│   AI GUIDE     │                                                │
│   SIDEBAR      │    Dashboard Home / Form Filler / Validator /  │
│   (300px)      │    Photo Compliance / Travel Planner          │
│                │                                                │
│   - Chat UI    │    ┌──────────────────────────────────┐      │
│   - Context    │    │                                  │      │
│   - Quick Helps│    │     Workflow Content             │      │
│   - Suggestions│    │                                  │      │
│                │    └──────────────────────────────────┘      │
│                │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

### Component Breakdown

```tsx
<DashboardLayout>
  {/* Top Nav - Always visible */}
  <TopNavigationBar />
  
  <div className="flex min-h-screen">
    
    {/* Jeffrey AI Sidebar - ALWAYS VISIBLE (not a separate tab!) */}
    <JeffreySidebar 
      width="300px"
      currentWorkflow={activeWorkflow}
      packageContext={currentPackage}
      sticky
    />
    
    {/* Main Content - Changes based on route */}
    <MainContent className="flex-1">
      <Routes>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/form-filler" element={<FormFillerWorkflow />} />
        <Route path="/validator" element={<DocumentValidatorWorkflow />} />
        <Route path="/photo-compliance" element={<PhotoComplianceWorkflow />} />
        <Route path="/travel-planner" element={<TravelPlannerWorkflow />} />
        <Route path="/package/:id" element={<PackageView />} />
      </Routes>
    </MainContent>
    
  </div>
</DashboardLayout>
```

---

## 🤖 Jeffrey AI Sidebar - The Heart of Everything

### Design & Features

```tsx
<JeffreySidebar className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[300px]
                           bg-white border-r border-neutral-200
                           flex flex-col">
  
  {/* Jeffrey Header */}
  <div className="p-4 border-b border-neutral-200">
    <div className="flex items-center gap-3 mb-2">
      {/* Jeffrey Avatar with AI indicator */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-start to-accent-start
                       flex items-center justify-center text-white text-xl font-bold
                       shadow-lg shadow-primary/30">
          J
        </div>
        {/* Pulsing "online" indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full
                       border-2 border-white animate-pulse" />
      </div>
      
      <div>
        <h3 className="font-bold text-neutral-900">Jeffrey</h3>
        <p className="text-xs text-neutral-500">Your AI Visa Guide</p>
      </div>
    </div>
    
    {/* Context Badge - Shows what Jeffrey is currently helping with */}
    <ContextBadge 
      workflow={currentWorkflow}
      className="text-xs bg-primary/10 text-primary-start px-3 py-1 rounded-full"
    >
      {currentWorkflow === 'form-filler' && "Helping with: Form Auto-Fill"}
      {currentWorkflow === 'validator' && "Helping with: Document Validation"}
      {currentWorkflow === 'photo' && "Helping with: Photo Requirements"}
      {currentWorkflow === 'travel' && "Helping with: Travel Planning"}
      {currentWorkflow === null && "Ready to help with your visa journey"}
    </ContextBadge>
  </div>
  
  {/* Chat Messages Area - Scrollable */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    
    {/* System Message - Jeffrey introduces himself */}
    {messages.length === 0 && (
      <SystemMessage>
        <div className="bg-gradient-to-br from-primary-start/10 to-accent-start/10
                       rounded-2xl p-4 border border-primary/20">
          <p className="text-sm text-neutral-700 mb-3">
            👋 Hi! I'm Jeffrey, your AI visa assistant. I'm here to guide you through:
          </p>
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 mt-0.5 text-primary-start" />
              <span>Auto-filling visa application forms</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-primary-start" />
              <span>Validating your documents</span>
            </li>
            <li className="flex items-start gap-2">
              <Camera className="w-4 h-4 mt-0.5 text-primary-start" />
              <span>Generating visa-compliant photos</span>
            </li>
            <li className="flex items-start gap-2">
              <Plane className="w-4 h-4 mt-0.5 text-primary-start" />
              <span>Planning your travel itinerary</span>
            </li>
          </ul>
        </div>
      </SystemMessage>
    )}
    
    {/* Chat Messages */}
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        role={message.role}
        content={message.content}
        sources={message.sources}
        timestamp={message.timestamp}
      />
    ))}
    
    {/* Jeffrey is typing indicator */}
    {isTyping && <TypingIndicator />}
    
  </div>
  
  {/* Quick Action Suggestions - Context-aware */}
  <QuickSuggestions 
    workflow={currentWorkflow}
    className="p-3 border-t border-neutral-200 bg-neutral-50"
  >
    <p className="text-xs font-semibold text-neutral-500 mb-2">Quick Asks:</p>
    <div className="flex flex-wrap gap-2">
      {currentWorkflow === 'form-filler' && (
        <>
          <SuggestionChip onClick={() => askJeffrey("What fields do I still need to fill?")}>
            Missing fields?
          </SuggestionChip>
          <SuggestionChip onClick={() => askJeffrey("How do I get my Emirates ID number?")}>
            Get Emirates ID?
          </SuggestionChip>
        </>
      )}
      
      {currentWorkflow === 'validator' && (
        <>
          <SuggestionChip onClick={() => askJeffrey("What documents are still missing?")}>
            What's missing?
          </SuggestionChip>
          <SuggestionChip onClick={() => askJeffrey("Do I need to attest my degree?")}>
            Attest degree?
          </SuggestionChip>
        </>
      )}
      
      {currentWorkflow === 'photo' && (
        <>
          <SuggestionChip onClick={() => askJeffrey("What are UAE visa photo requirements?")}>
            Photo specs?
          </SuggestionChip>
          <SuggestionChip onClick={() => askJeffrey("Can I wear glasses?")}>
            Glasses allowed?
          </SuggestionChip>
        </>
      )}
      
      {currentWorkflow === 'travel' && (
        <>
          <SuggestionChip onClick={() => askJeffrey("What's the cheapest flight option?")}>
            Cheap flights?
          </SuggestionChip>
          <SuggestionChip onClick={() => askJeffrey("Do I need travel insurance?")}>
            Need insurance?
          </SuggestionChip>
        </>
      )}
      
      {/* Global suggestions */}
      <SuggestionChip onClick={() => askJeffrey("Show my overall progress")}>
        My progress
      </SuggestionChip>
    </div>
  </QuickSuggestions>
  
  {/* Chat Input */}
  <div className="p-4 border-t border-neutral-200">
    <div className="relative">
      <textarea
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder="Ask Jeffrey anything..."
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-12
                   resize-none focus:ring-2 focus:ring-primary-start focus:border-transparent
                   text-sm"
        rows={2}
      />
      
      <button
        onClick={sendMessage}
        disabled={!inputMessage.trim() || isTyping}
        className="absolute bottom-3 right-3 w-8 h-8 rounded-lg
                   bg-gradient-to-r from-primary-start to-accent-start
                   text-white flex items-center justify-center
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-lg hover:scale-105 transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  </div>
  
</JeffreySidebar>
```

---

## 🏠 Dashboard Home - Central Hub

### Overview Cards

```tsx
<DashboardHome className="p-8">
  
  {/* Welcome Header */}
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">
      Welcome back,{' '}
      <span className="bg-gradient-to-r from-primary-start to-accent-start
                       bg-clip-text text-transparent">
        {user.name}
      </span>
    </h1>
    <p className="text-xl text-neutral-600">
      Continue your visa application journey
    </p>
  </div>
  
  {/* Overall Progress Card */}
  <Card className="mb-8 p-6 bg-gradient-to-br from-primary-start/10 to-accent-start/10
                   border border-primary/20 rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold text-neutral-900">
        Overall Application Progress
      </h2>
      <Badge className="bg-green-100 text-green-700 px-4 py-2 text-lg">
        {overallCompleteness}% Complete
      </Badge>
    </div>
    
    <ProgressBar 
      value={overallCompleteness}
      className="h-4 rounded-full mb-4"
    />
    
    <div className="grid grid-cols-4 gap-4 text-center">
      <ProgressStat
        icon={FileText}
        label="Forms"
        value={formProgress}
        total={totalForms}
      />
      <ProgressStat
        icon={CheckCircle}
        label="Documents"
        value={validatedDocs}
        total={totalDocs}
      />
      <ProgressStat
        icon={Camera}
        label="Photos"
        value={photoProgress}
        total={requiredPhotos}
      />
      <ProgressStat
        icon={Plane}
        label="Travel"
        value={travelProgress}
        total={1}
      />
    </div>
  </Card>
  
  {/* 4 Service Cards - Entry points to each workflow */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    
    {/* 1. AI Form Filler */}
    <ServiceCard
      icon={FileText}
      title="AI Form Filler"
      description="Auto-fill visa application forms with AI"
      gradient="from-blue-500 to-indigo-600"
      stats={{
        total: package.filledForms?.length || 0,
        label: 'forms filled'
      }}
      cta={{
        label: formProgress < totalForms ? 'Continue Filling' : 'View Forms',
        href: '/form-filler'
      }}
      onClick={() => {
        navigateToWorkflow('form-filler');
        notifyJeffrey('form-filler'); // Jeffrey becomes contextual
      }}
    />
    
    {/* 2. Document Validator */}
    <ServiceCard
      icon={CheckCircle}
      title="Document Validator"
      description="AI-powered document verification & validation"
      gradient="from-green-500 to-emerald-600"
      stats={{
        total: validatedDocs,
        label: 'docs validated',
        completeness: docCompleteness
      }}
      cta={{
        label: validatedDocs < totalDocs ? 'Validate Documents' : 'Review Documents',
        href: '/validator'
      }}
      onClick={() => {
        navigateToWorkflow('validator');
        notifyJeffrey('validator');
      }}
    />
    
    {/* 3. AI Photo Compliance */}
    <ServiceCard
      icon={Camera}
      title="AI Photo Compliance"
      description="Generate visa-compliant photos for any country"
      gradient="from-purple-500 to-pink-600"
      stats={{
        total: package.visaPhotos?.length || 0,
        label: 'visa photos'
      }}
      cta={{
        label: photoProgress === 0 ? 'Generate Photos' : 'View Photos',
        href: '/photo-compliance'
      }}
      onClick={() => {
        navigateToWorkflow('photo');
        notifyJeffrey('photo');
      }}
    />
    
    {/* 4. AI Travel Itinerary */}
    <ServiceCard
      icon={Plane}
      title="AI Travel Planner"
      description="Smart itinerary generation for visa applications"
      gradient="from-orange-500 to-red-600"
      stats={{
        total: travelProgress,
        label: 'itinerary ready'
      }}
      cta={{
        label: travelProgress === 0 ? 'Create Itinerary' : 'View Itinerary',
        href: '/travel-planner'
      }}
      onClick={() => {
        navigateToWorkflow('travel');
        notifyJeffrey('travel');
      }}
    />
    
  </div>
  
  {/* Recent Activity Timeline */}
  <Card className="p-6 rounded-2xl">
    <h3 className="text-2xl font-bold mb-6 text-neutral-900">
      Recent Activity
    </h3>
    
    <ActivityTimeline>
      {recentActivity.map((activity, index) => (
        <TimelineItem
          key={index}
          icon={getIconForActivity(activity.type)}
          timestamp={activity.timestamp}
          title={activity.title}
          description={activity.description}
          status={activity.status}
        />
      ))}
    </ActivityTimeline>
  </Card>
  
  {/* Jeffrey's Smart Recommendations */}
  <Card className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5
                   border border-primary/20">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-start to-accent-start
                     flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
        J
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-2 text-neutral-900">
          Jeffrey's Recommendations
        </h3>
        
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-start mt-0.5 flex-shrink-0" />
              <p className="text-neutral-700">{rec}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </Card>
  
</DashboardHome>
```

---

## 📝 Workflow 1: AI Form Filler

### Integration with Jeffrey

```tsx
<FormFillerWorkflow className="p-8">
  
  {/* Breadcrumb Navigation */}
  <Breadcrumb>
    <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
    <BreadcrumbItem active>AI Form Filler</BreadcrumbItem>
  </Breadcrumb>
  
  {/* Page Header */}
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">AI Form Filler</h1>
    <p className="text-xl text-neutral-600">
      Let AI auto-fill your visa application forms using your uploaded documents
    </p>
  </div>
  
  {/* Jeffrey Context Update */}
  <useEffect(() => {
    // When user enters this workflow, update Jeffrey's context
    updateJeffreyContext({
      workflow: 'form-filler',
      message: "I see you're working on filling forms. I can help with field questions!",
      suggestions: [
        "What fields do I still need to fill?",
        "Where do I find my Emirates ID number?",
        "How do I format the passport issue date?"
      ]
    });
  }, []);
  
  {/* Step-by-step Form Filling */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Left: Form Selection & Preview */}
    <Card className="lg:col-span-2 p-6 rounded-2xl">
      
      {/* Form Selection */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4">Select Form to Fill</h3>
        
        <div className="space-y-3">
          {availableForms.map(form => (
            <FormCard
              key={form.id}
              form={form}
              selected={selectedForm?.id === form.id}
              progress={form.completeness}
              onClick={() => selectForm(form)}
            />
          ))}
        </div>
      </div>
      
      {/* Form Preview & Editing */}
      {selectedForm && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">{selectedForm.name}</h3>
            <Badge className={cn(
              "px-4 py-2",
              selectedForm.completeness === 100 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            )}>
              {selectedForm.completeness}% Complete
            </Badge>
          </div>
          
          {/* PDF Preview with Overlay Editor */}
          <PDFFormEditor
            formUrl={selectedForm.originalUrl}
            extractedFields={selectedForm.extractedFields}
            filledData={selectedForm.filledData}
            onFieldUpdate={(fieldName, value) => {
              updateFormField(selectedForm.id, fieldName, value);
              
              // Notify Jeffrey about the update
              notifyJeffrey({
                type: 'field_updated',
                field: fieldName,
                value: value
              });
            }}
            onAskJeffrey={(fieldName, question) => {
              // User clicks "Ask Jeffrey" button next to a field
              askJeffreyAboutField(fieldName, question);
            }}
          />
        </div>
      )}
      
    </Card>
    
    {/* Right: Extracted Data Preview */}
    <Card className="p-6 rounded-2xl">
      <h3 className="text-lg font-bold mb-4">Auto-Extracted Data</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Jeffrey extracted this data from your uploaded documents:
      </p>
      
      <ExtractedDataList>
        {extractedData.map((field, index) => (
          <DataField
            key={index}
            label={field.label}
            value={field.value}
            source={field.source}
            confidence={field.confidence}
            onEdit={() => editExtractedField(field)}
          />
        ))}
      </ExtractedDataList>
      
      {/* Data Sources */}
      <div className="mt-6 p-4 bg-neutral-50 rounded-xl">
        <p className="text-xs font-semibold text-neutral-500 mb-2">
          Data extracted from:
        </p>
        <div className="space-y-2">
          {dataSources.map(source => (
            <div key={source.id} className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-primary-start" />
              <span className="text-neutral-700">{source.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
    
  </div>
  
  {/* Action Buttons */}
  <div className="flex items-center gap-4 mt-8">
    <Button
      variant="gradient"
      size="lg"
      onClick={handleAutoFillAll}
      disabled={!selectedForm || selectedForm.completeness === 100}
      className="rounded-xl shadow-lg"
    >
      <Sparkles className="w-5 h-5 mr-2" />
      Auto-Fill All Fields
    </Button>
    
    <Button
      variant="outline"
      size="lg"
      onClick={handleDownloadForm}
      disabled={!selectedForm}
      className="rounded-xl"
    >
      <Download className="w-5 h-5 mr-2" />
      Download Form
    </Button>
    
    <Button
      variant="outline"
      size="lg"
      onClick={() => askJeffrey("What fields am I still missing?")}
      className="rounded-xl"
    >
      <MessageCircle className="w-5 h-5 mr-2" />
      Ask Jeffrey
    </Button>
  </div>
  
</FormFillerWorkflow>
```

---

## ✅ Workflow 2: Document Validator

```tsx
<DocumentValidatorWorkflow className="p-8">
  
  <Breadcrumb>
    <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
    <BreadcrumbItem active>Document Validator</BreadcrumbItem>
  </Breadcrumb>
  
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">Document Validator</h1>
    <p className="text-xl text-neutral-600">
      AI-powered validation to ensure all your documents meet visa requirements
    </p>
  </div>
  
  {/* Jeffrey Context Update */}
  <useEffect(() => {
    updateJeffreyContext({
      workflow: 'validator',
      message: "Let me help verify your documents against the requirements!",
      suggestions: [
        "What documents are still missing?",
        "Do I need to attest my degree?",
        "Is my passport photo acceptable?"
      ]
    });
  }, []);
  
  {/* Validation Dashboard */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Left: Document Checklist */}
    <Card className="lg:col-span-2 p-6 rounded-2xl">
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Requirements Checklist</h3>
        <CompletionBadge 
          value={documentCompleteness}
          className="text-lg px-4 py-2"
        />
      </div>
      
      {/* Mandatory Documents */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Mandatory Documents
        </h4>
        
        <div className="space-y-3">
          {mandatoryRequirements.map(req => (
            <RequirementCard
              key={req.id}
              requirement={req}
              status={getRequirementStatus(req)}
              onUpload={() => openUploadModal(req)}
              onView={() => viewDocument(req.documentId)}
              onAskJeffrey={() => askJeffrey(`Tell me about ${req.item}`)}
            />
          ))}
        </div>
      </div>
      
      {/* Optional Documents */}
      <div>
        <h4 className="text-lg font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Optional Documents (Recommended)
        </h4>
        
        <div className="space-y-3">
          {optionalRequirements.map(req => (
            <RequirementCard
              key={req.id}
              requirement={req}
              status={getRequirementStatus(req)}
              optional
              onUpload={() => openUploadModal(req)}
              onView={() => viewDocument(req.documentId)}
              onAskJeffrey={() => askJeffrey(`Is ${req.item} important?`)}
            />
          ))}
        </div>
      </div>
      
    </Card>
    
    {/* Right: Validation Insights */}
    <Card className="p-6 rounded-2xl">
      
      <h3 className="text-lg font-bold mb-4">Validation Insights</h3>
      
      {/* AI Validation Results */}
      <div className="space-y-4 mb-6">
        {validationInsights.map((insight, index) => (
          <InsightCard
            key={index}
            type={insight.type} // success, warning, error
            title={insight.title}
            description={insight.description}
            action={insight.action}
          />
        ))}
      </div>
      
      {/* Jeffrey's Recommendations */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-start to-accent-start
                         flex items-center justify-center text-white text-sm font-bold">
            J
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500">Jeffrey's Advice</p>
            <p className="text-sm text-neutral-700 mt-1">
              {jeffreyRecommendation}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => askJeffrey("What should I do next?")}
          className="w-full rounded-lg"
        >
          Ask for More Help
        </Button>
      </div>
      
    </Card>
    
  </div>
  
  {/* Action Bar */}
  <div className="flex items-center gap-4 mt-8">
    <Button
      variant="gradient"
      size="lg"
      onClick={handleValidateAll}
      className="rounded-xl shadow-lg"
    >
      <CheckCircle className="w-5 h-5 mr-2" />
      Validate All Documents
    </Button>
    
    <Button
      variant="outline"
      size="lg"
      onClick={handleUploadMore}
      className="rounded-xl"
    >
      <Upload className="w-5 h-5 mr-2" />
      Upload More Documents
    </Button>
  </div>
  
</DocumentValidatorWorkflow>
```

---

## 📸 Workflow 3: AI Photo Compliance

```tsx
<PhotoComplianceWorkflow className="p-8">
  
  <Breadcrumb>
    <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
    <BreadcrumbItem active>AI Photo Compliance</BreadcrumbItem>
  </Breadcrumb>
  
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">AI Photo Compliance</h1>
    <p className="text-xl text-neutral-600">
      Generate perfect visa photos that meet every country's requirements
    </p>
  </div>
  
  {/* Jeffrey Context Update */}
  <useEffect(() => {
    updateJeffreyContext({
      workflow: 'photo',
      message: "I'll help you create visa-compliant photos for any country!",
      suggestions: [
        "What are UAE visa photo requirements?",
        "Can I wear glasses in the photo?",
        "What background color do I need?"
      ]
    });
  }, []);
  
  {/* Photo Generation Interface */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Left: Photo Upload & Generation */}
    <Card className="lg:col-span-2 p-6 rounded-2xl">
      
      {/* Upload Selfies */}
      {!hasUploadedPhotos && (
        <div>
          <h3 className="text-2xl font-bold mb-4">Upload Your Photos</h3>
          <p className="text-neutral-600 mb-6">
            Upload 3-5 selfies and let AI generate visa-compliant photos
          </p>
          
          <PhotoUploader
            onUpload={handlePhotoUpload}
            guidelines={PHOTO_GUIDELINES}
            maxPhotos={5}
          />
        </div>
      )}
      
      {/* Generated Photos Gallery */}
      {hasUploadedPhotos && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Your Visa Photos</h3>
            <Badge className="bg-green-100 text-green-700 px-4 py-2">
              {generatedPhotos.length} photos ready
            </Badge>
          </div>
          
          {/* Photo Format Tabs */}
          <Tabs value={selectedFormat} onValueChange={setSelectedFormat}>
            <TabsList className="mb-6">
              <TabsTrigger value="uae">UAE Visa</TabsTrigger>
              <TabsTrigger value="schengen">Schengen</TabsTrigger>
              <TabsTrigger value="us">US Visa</TabsTrigger>
              <TabsTrigger value="passport">Passport Photo</TabsTrigger>
            </TabsList>
            
            {/* Photo Grid for Selected Format */}
            <TabsContent value={selectedFormat}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getPhotosForFormat(selectedFormat).map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    specifications={photo.specifications}
                    onDownload={() => downloadPhoto(photo)}
                    onPreview={() => previewPhoto(photo)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
    </Card>
    
    {/* Right: Photo Requirements */}
    <Card className="p-6 rounded-2xl">
      
      <h3 className="text-lg font-bold mb-4">Photo Requirements</h3>
      
      {selectedFormat && (
        <div>
          <FormatSpecifications
            format={VISA_PHOTO_SPECS[selectedFormat]}
          />
          
          {/* Ask Jeffrey about requirements */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => askJeffrey(`Tell me about ${selectedFormat} photo requirements`)}
            className="w-full rounded-lg mt-4"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask Jeffrey
          </Button>
        </div>
      )}
      
      {/* Compliance Checklist */}
      <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
        <p className="text-sm font-semibold text-green-700 mb-2">
          ✓ All Photos Meet Requirements:
        </p>
        <ul className="space-y-1 text-sm text-green-600">
          <li>• Correct dimensions & aspect ratio</li>
          <li>• Proper background color</li>
          <li>• Face size within specs</li>
          <li>• High resolution (600 DPI)</li>
          <li>• Ready for submission</li>
        </ul>
      </div>
      
    </Card>
    
  </div>
  
  {/* Action Buttons */}
  <div className="flex items-center gap-4 mt-8">
    <Button
      variant="gradient"
      size="lg"
      onClick={handleGenerateMore}
      disabled={!hasUploadedPhotos}
      className="rounded-xl shadow-lg"
    >
      <Camera className="w-5 h-5 mr-2" />
      Generate More Formats
    </Button>
    
    <Button
      variant="outline"
      size="lg"
      onClick={handleDownloadAll}
      disabled={generatedPhotos.length === 0}
      className="rounded-xl"
    >
      <Download className="w-5 h-5 mr-2" />
      Download All Photos
    </Button>
  </div>
  
</PhotoComplianceWorkflow>
```

---

## ✈️ Workflow 4: AI Travel Planner

```tsx
<TravelPlannerWorkflow className="p-8">
  
  <Breadcrumb>
    <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
    <BreadcrumbItem active>AI Travel Planner</BreadcrumbItem>
  </Breadcrumb>
  
  <div className="mb-8">
    <h1 className="text-4xl font-bold mb-2">AI Travel Planner</h1>
    <p className="text-xl text-neutral-600">
      Generate a visa-ready travel itinerary with flights, hotels, and activities
    </p>
  </div>
  
  {/* Jeffrey Context Update */}
  <useEffect(() => {
    updateJeffreyContext({
      workflow: 'travel',
      message: "Let me help you plan the perfect trip for your visa application!",
      suggestions: [
        "What's the cheapest flight option?",
        "Do I need travel insurance?",
        "How many days should I book hotels for?"
      ]
    });
  }, []);
  
  {/* Travel Planning Interface */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* Left: Itinerary Builder */}
    <Card className="lg:col-span-2 p-6 rounded-2xl">
      
      {/* Step 1: Trip Details */}
      {currentStep === 1 && (
        <div>
          <h3 className="text-2xl font-bold mb-6">Trip Details</h3>
          
          <form className="space-y-6">
            <FormField label="Destination Country">
              <Select
                value={destination}
                onChange={setDestination}
                options={DESTINATION_COUNTRIES}
              />
            </FormField>
            
            <FormField label="Travel Dates">
              <DateRangePicker
                value={travelDates}
                onChange={setTravelDates}
              />
            </FormField>
            
            <FormField label="Trip Purpose">
              <Select
                value={tripPurpose}
                onChange={setTripPurpose}
                options={['Tourism', 'Business', 'Visit Family', 'Medical']}
              />
            </FormField>
            
            <FormField label="Budget (Optional)">
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </FormField>
            
            <Button
              variant="gradient"
              size="lg"
              onClick={handleGenerateItinerary}
              className="w-full rounded-xl shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate AI Itinerary
            </Button>
          </form>
        </div>
      )}
      
      {/* Step 2: Generated Itinerary */}
      {currentStep === 2 && generatedItinerary && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Your Travel Itinerary</h3>
            <Badge className="bg-green-100 text-green-700 px-4 py-2">
              Visa-Ready
            </Badge>
          </div>
          
          {/* Itinerary Timeline */}
          <ItineraryTimeline>
            
            {/* Flights */}
            <TimelineSection icon={Plane} title="Flights">
              {generatedItinerary.flights.map((flight, index) => (
                <FlightCard
                  key={index}
                  flight={flight}
                  onSelect={() => selectFlight(flight)}
                />
              ))}
            </TimelineSection>
            
            {/* Accommodation */}
            <TimelineSection icon={Building} title="Accommodation">
              {generatedItinerary.hotels.map((hotel, index) => (
                <HotelCard
                  key={index}
                  hotel={hotel}
                  onSelect={() => selectHotel(hotel)}
                />
              ))}
            </TimelineSection>
            
            {/* Activities */}
            <TimelineSection icon={MapPin} title="Activities">
              {generatedItinerary.activities.map((activity, index) => (
                <ActivityCard
                  key={index}
                  activity={activity}
                  day={activity.day}
                />
              ))}
            </TimelineSection>
            
            {/* Travel Insurance */}
            <TimelineSection icon={Shield} title="Travel Insurance">
              <InsuranceRecommendation
                destination={destination}
                travelDates={travelDates}
                options={generatedItinerary.insurance}
              />
            </TimelineSection>
            
          </ItineraryTimeline>
        </div>
      )}
      
    </Card>
    
    {/* Right: Travel Summary */}
    <Card className="p-6 rounded-2xl">
      
      <h3 className="text-lg font-bold mb-4">Trip Summary</h3>
      
      {generatedItinerary && (
        <div className="space-y-4">
          
          <SummaryItem
            icon={MapPin}
            label="Destination"
            value={destination}
          />
          
          <SummaryItem
            icon={Calendar}
            label="Duration"
            value={`${tripDuration} days`}
          />
          
          <SummaryItem
            icon={DollarSign}
            label="Est. Total Cost"
            value={`$${estimatedCost}`}
          />
          
          <SummaryItem
            icon={Plane}
            label="Flights"
            value={`${generatedItinerary.flights.length} bookings`}
          />
          
          <SummaryItem
            icon={Building}
            label="Hotels"
            value={`${generatedItinerary.hotels.length} nights`}
          />
          
          {/* Jeffrey's Travel Tips */}
          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-start to-accent-start
                             flex items-center justify-center text-white text-sm font-bold">
                J
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500">Jeffrey's Travel Tips</p>
                <ul className="text-sm text-neutral-700 mt-2 space-y-1">
                  {travelTips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
        </div>
      )}
      
    </Card>
    
  </div>
  
  {/* Action Buttons */}
  {generatedItinerary && (
    <div className="flex items-center gap-4 mt-8">
      <Button
        variant="gradient"
        size="lg"
        onClick={handleDownloadItinerary}
        className="rounded-xl shadow-lg"
      >
        <Download className="w-5 h-5 mr-2" />
        Download PDF Itinerary
      </Button>
      
      <Button
        variant="outline"
        size="lg"
        onClick={() => askJeffrey("Review my itinerary")}
        className="rounded-xl"
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        Ask Jeffrey to Review
      </Button>
      
      <Button
        variant="outline"
        size="lg"
        onClick={handleRegenerateItinerary}
        className="rounded-xl"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        Regenerate
      </Button>
    </div>
  )}
  
</TravelPlannerWorkflow>
```

---

## 🧠 Jeffrey's Context-Aware Intelligence

### How Jeffrey Stays Contextual

```typescript
// backend/services/jeffrey-ai.ts

interface JeffreyContext {
  workflow: 'dashboard' | 'form-filler' | 'validator' | 'photo' | 'travel' | null;
  packageId: number;
  userState: {
    currentStep?: string;
    selectedForm?: string;
    uploadedDocuments?: string[];
    generatedPhotos?: number;
    itineraryGenerated?: boolean;
  };
  recentActions: Array<{
    timestamp: Date;
    action: string;
    details: any;
  }>;
}

export async function chatWithJeffrey(
  messages: ChatMessage[],
  context: JeffreyContext
): Promise<{
  response: string;
  suggestions: string[];
}> {
  
  // Build context-aware system prompt
  const systemPrompt = buildContextualPrompt(context);
  
  // Query RAG for relevant visa knowledge
  const ragContext = await queryVisa(
    messages[messages.length - 1].content,
    {
      country: context.packageId ? getPackageCountry(context.packageId) : undefined,
      visaType: context.packageId ? getPackageVisaType(context.packageId) : undefined,
    }
  );
  
  // Generate response with Gemini
  const prompt = `
    ${systemPrompt}
    
    Current Workflow: ${context.workflow || 'Dashboard'}
    User's Recent Actions:
    ${context.recentActions.map(a => `- ${a.action}`).join('\n')}
    
    Relevant Visa Information:
    ${ragContext.sources.map(s => s.text).join('\n\n')}
    
    Conversation History:
    ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
    
    Instructions:
    - You are Jeffrey, a friendly and helpful visa assistant
    - Provide specific, actionable advice
    - Reference the current workflow context
    - Use the visa knowledge to answer questions accurately
    - Be conversational and supportive
    - Keep responses concise but helpful
    
    Generate a response and 2-3 follow-up suggestions.
  `;
  
  const result = await geminiModel.generateContent(prompt);
  
  return {
    response: result.response.text(),
    suggestions: extractSuggestions(result.response.text()),
  };
}

function buildContextualPrompt(context: JeffreyContext): string {
  const basePrompt = "You are Jeffrey, an AI visa assistant.";
  
  switch (context.workflow) {
    case 'form-filler':
      return `${basePrompt} You are currently helping the user fill out visa application forms. 
              Focus on field-specific guidance, data extraction, and form completion tips.`;
    
    case 'validator':
      return `${basePrompt} You are currently helping the user validate their visa documents.
              Focus on document requirements, attestation needs, and completeness checking.`;
    
    case 'photo':
      return `${basePrompt} You are currently helping the user generate visa-compliant photos.
              Focus on photo specifications, requirements, and format guidance.`;
    
    case 'travel':
      return `${basePrompt} You are currently helping the user plan their travel itinerary.
              Focus on flight options, hotel recommendations, and visa application requirements.`;
    
    default:
      return `${basePrompt} You are helping the user navigate their visa application journey.
              Provide guidance across all services: forms, documents, photos, and travel.`;
  }
}
```

---

## 🎨 Visual Design Language

### Jeffrey's Visual Identity

```css
/* Jeffrey's signature gradient */
.jeffrey-gradient {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
}

/* Jeffrey's avatar */
.jeffrey-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--jeffrey-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
  box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.3);
}

/* Jeffrey's chat messages */
.jeffrey-message {
  background: linear-gradient(135deg, #F0F0FF 0%, #F5F3FF 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

/* User messages */
.user-message {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
  align-self: flex-end;
}
```

---

## 📊 Data Flow Between Services

### Unified Package Model

```typescript
// All 4 services share ONE package
interface UnifiedVisaPackage {
  id: number;
  userId: string;
  
  // Shared metadata
  destinationCountry: string;
  visaType: string;
  status: 'in_progress' | 'ready' | 'submitted';
  
  // Service 1: Form Filler
  forms: {
    id: string;
    name: string;
    originalUrl: string;
    filledUrl?: string;
    extractedFields: object;
    filledData: object;
    completeness: number;
  }[];
  
  // Service 2: Document Validator
  documents: {
    id: string;
    type: string;
    url: string;
    validated: boolean;
    extractedData?: object;
  }[];
  requirements: {
    item: string;
    completed: boolean;
    documentId?: string;
  }[];
  
  // Service 3: Photo Compliance
  visaPhotos: {
    format: string;
    url: string;
    specifications: object;
  }[];
  
  // Service 4: Travel Planner
  itinerary?: {
    flights: any[];
    hotels: any[];
    activities: any[];
    insurance: any[];
  };
  
  // Jeffrey's interaction history
  chatHistory: {
    messages: ChatMessage[];
    lastUpdated: Date;
  };
  
  // Overall progress
  overallCompleteness: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up unified dashboard layout
- [ ] Implement persistent Jeffrey sidebar
- [ ] Create context-switching logic for Jeffrey
- [ ] Build base workflow routing

### Phase 2: Jeffrey AI Integration (Week 3-4)
- [ ] Integrate Gemini 2.5 Pro for chat
- [ ] Build RAG pipeline for visa knowledge
- [ ] Implement context-aware prompting
- [ ] Create suggestion engine

### Phase 3: Service Integration (Week 5-8)
- [ ] Integrate Form Filler workflow
- [ ] Integrate Document Validator workflow
- [ ] Integrate Photo Compliance workflow
- [ ] Integrate Travel Planner workflow

### Phase 4: Polish & Testing (Week 9-10)
- [ ] UI/UX refinement
- [ ] Cross-service data flow testing
- [ ] Jeffrey's contextual awareness testing
- [ ] Performance optimization

---

## 💡 Key Differentiators

### Why This Design Wins

1. **Jeffrey is Always Present** - Not hidden in a tab, but your constant companion
2. **Context-Aware AI** - Jeffrey knows what you're working on and adapts
3. **Unified Progress Tracking** - See your entire visa journey in one place
4. **Seamless Service Integration** - Data flows automatically between all 4 services
5. **Conversation-Driven UX** - Ask Jeffrey anything, anytime
6. **Smart Suggestions** - Jeffrey proactively recommends next steps

---

## 🎯 Success Metrics

- **User Engagement**: Time spent with Jeffrey (target: 5+ mins/session)
- **Completion Rate**: Users who finish all 4 workflows (target: 60%+)
- **Jeffrey Accuracy**: % of questions answered correctly (target: 90%+)
- **Cross-Service Usage**: Users who use 3+ services (target: 75%+)
- **Satisfaction Score**: Jeffrey helpfulness rating (target: 4.5/5)

---

## 🔄 Future Enhancements

- **Voice Interface**: Talk to Jeffrey instead of typing
- **Mobile App**: Jeffrey in your pocket
- **Multi-language**: Jeffrey speaks Arabic, Hindi, Urdu
- **Smart Notifications**: Jeffrey proactively alerts you
- **WhatsApp Integration**: Chat with Jeffrey on WhatsApp
- **Calendar Sync**: Jeffrey tracks visa deadlines

---

**The Result**: A truly unified, AI-first visa application platform where Jeffrey is your intelligent guide through every step of the journey - not just a chatbot in a tab, but a contextual companion embedded in your entire experience.
